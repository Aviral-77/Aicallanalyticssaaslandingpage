from dotenv import load_dotenv
load_dotenv()  # Must run before any os.getenv() calls

import json
import os

# ── Active LLM provider errors ────────────────────────────────────────────────
import google.api_core.exceptions as google_exceptions   # Gemini
# import openai                                           # OpenAI (commented out)
# import anthropic as anthropic_sdk                       # Anthropic (commented out)

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

import models
import schemas
import auth
from database import engine, get_db
from content_extractor import extract as extract_content
from llm import generate_carousel, generate_from_topic, generate_post
from logger import Timer, app_log, setup_logging
from linkedin_scraper import scrape_posts
from persona import analyze_voice, voice_prompt_block
from research import research_topic
from search import build_search_query, format_search_context, search_web

# ── Startup ────────────────────────────────────────────────────────────────────

setup_logging()
models.Base.metadata.create_all(bind=engine)


def _run_migrations() -> None:
    """Add new columns / tables to existing databases without dropping data."""
    migrations = [
        "ALTER TABLE repurposed_posts ADD COLUMN versions_json TEXT",
        # Credits + onboarding — DEFAULT 10 / DEFAULT 1 so existing users keep access
        "ALTER TABLE users ADD COLUMN credits INTEGER NOT NULL DEFAULT 10",
        "ALTER TABLE users ADD COLUMN onboarding_complete BOOLEAN NOT NULL DEFAULT 1",
        # UserPersona table
        (
            "CREATE TABLE IF NOT EXISTS user_personas ("
            "id INTEGER PRIMARY KEY, user_id INTEGER UNIQUE NOT NULL, "
            "linkedin_url VARCHAR(500), sample_posts_json TEXT, "
            "voice_profile TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)"
        ),
        (
            "CREATE TABLE IF NOT EXISTS scheduled_posts ("
            "id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, "
            "content TEXT NOT NULL, platform VARCHAR(50) NOT NULL, "
            "scheduled_for DATETIME NOT NULL, status VARCHAR(20) DEFAULT 'pending', "
            "source_label VARCHAR(300), created_at DATETIME DEFAULT CURRENT_TIMESTAMP)"
        ),
    ]
    with engine.connect() as conn:
        for stmt in migrations:
            try:
                conn.execute(text(stmt))
                conn.commit()
                app_log.info("migration | applied: %s", stmt[:60])
            except Exception:
                pass  # Already exists — safe to ignore


_run_migrations()

# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(title="Repost AI API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Auth routes ────────────────────────────────────────────────────────────────

@app.post("/auth/register", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def register(body: schemas.UserRegister, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(
        name=body.name,
        email=body.email,
        hashed_password=auth.hash_password(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    app_log.info("register | user_id=%d | email=%s", user.id, user.email)
    return schemas.Token(
        access_token=auth.create_access_token(user.id, user.email),
        token_type="bearer",
        user=user,
    )


@app.post("/auth/login", response_model=schemas.Token)
def login(body: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user or not auth.verify_password(body.password, user.hashed_password):
        app_log.warning("login_failed | email=%s", body.email)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    app_log.info("login | user_id=%d | email=%s", user.id, user.email)
    return schemas.Token(
        access_token=auth.create_access_token(user.id, user.email),
        token_type="bearer",
        user=user,
    )


@app.get("/auth/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@app.post("/auth/complete-onboarding", response_model=schemas.UserOut)
def complete_onboarding(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    current_user.onboarding_complete = True
    db.commit()
    db.refresh(current_user)
    return current_user


@app.post("/persona/suggest-topics", response_model=schemas.SuggestTopicsResponse)
async def suggest_topics_endpoint(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Generate 6 post topic suggestions based on the user's voice profile. Free — no credit cost."""
    persona = db.query(models.UserPersona).filter(
        models.UserPersona.user_id == current_user.id
    ).first()

    voice_summary = ""
    tone_label = "Thought Leader"
    if persona and persona.voice_profile:
        try:
            vp = json.loads(persona.voice_profile)
            voice_summary = vp.get("summary", "")
            tone_label = vp.get("tone_label", "Thought Leader")
        except Exception:
            pass

    topics = await _generate_topic_suggestions(
        name=current_user.name,
        voice_summary=voice_summary,
        tone_label=tone_label,
    )
    return schemas.SuggestTopicsResponse(topics=topics)


async def _generate_topic_suggestions(name: str, voice_summary: str, tone_label: str) -> list[dict]:
    """Use Gemini to generate 6 personalized LinkedIn post topic ideas."""
    import google.generativeai as genai
    if not os.getenv("GEMINI_API_KEY"):
        return _fallback_topics()

    voice_block = f"Their writing style: {voice_summary}" if voice_summary else ""
    prompt = (
        f"Generate 6 compelling LinkedIn post topic ideas for {name}, "
        f"a {tone_label}-style creator.\n"
        f"{voice_block}\n\n"
        "For each topic return a JSON object with:\n"
        '  "topic": short topic phrase (max 10 words)\n'
        '  "hook": a one-sentence attention-grabbing opener\n'
        '  "why": one sentence on why this will perform well\n\n'
        "Return ONLY a JSON array of 6 objects. No markdown, no explanation."
    )
    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction="You are a LinkedIn content strategist. Output only valid JSON.",
        )
        response = await model.generate_content_async(
            prompt,
            generation_config=genai.types.GenerationConfig(max_output_tokens=800),
        )
        raw = response.text.strip() if response.text else "[]"
        import re
        cleaned = re.sub(r"^```[a-z]*\n?|```$", "", raw, flags=re.MULTILINE).strip()
        data = json.loads(cleaned)
        return data if isinstance(data, list) else _fallback_topics()
    except Exception:
        return _fallback_topics()


def _fallback_topics() -> list[dict]:
    return [
        {"topic": "3 lessons I learned shipping my first product", "hook": "Shipping broke everything I thought I knew.", "why": "Personal story posts get 3× more comments."},
        {"topic": "Why most developers avoid personal branding", "hook": "Most devs are invisible online — and it's costing them.", "why": "Contrarian takes drive high engagement."},
        {"topic": "The one habit that doubled my productivity", "hook": "I stopped doing one thing and everything changed.", "why": "Productivity content consistently goes viral."},
        {"topic": "What nobody tells you about building in public", "hook": "Building in public sounds great until it isn't.", "why": "Authenticity + pain points = relatability."},
        {"topic": "5 tools I use every single day as a developer", "hook": "My entire workflow fits in 5 tools — here's the list.", "why": "List posts are highly shareable and saveable."},
        {"topic": "How I grew my LinkedIn from 0 to 1k followers", "hook": "Zero followers, zero strategy — here's what actually worked.", "why": "Growth stories attract massive reach."},
    ]


# ── Helpers ────────────────────────────────────────────────────────────────────

def _deduct_credit(user: models.User, db: Session) -> None:
    """Raise 402 if no credits remain, then deduct 1 credit and commit."""
    if user.credits <= 0:
        raise HTTPException(
            status_code=402,
            detail="No credits remaining. Please upgrade your plan to keep generating.",
        )
    user.credits -= 1
    db.commit()


def _get_user_voice(user_id: int, db: Session, user_name: str = "") -> str:
    """Return the prompt-ready voice block for a user, or '' if none."""
    persona = db.query(models.UserPersona).filter(
        models.UserPersona.user_id == user_id
    ).first()
    if not persona or not persona.voice_profile:
        return ""
    return voice_prompt_block(persona.voice_profile, user_name=user_name)


def _persona_to_out(persona: models.UserPersona) -> schemas.PersonaOut:
    """Convert a DB UserPersona row to PersonaOut schema."""
    sample_posts = json.loads(persona.sample_posts_json) if persona.sample_posts_json else []
    voice_profile: schemas.VoiceProfile | None = None
    if persona.voice_profile:
        try:
            vp_data = json.loads(persona.voice_profile)
            voice_profile = schemas.VoiceProfile(**vp_data)
        except Exception:
            pass
    return schemas.PersonaOut(
        linkedin_url=persona.linkedin_url,
        sample_posts=sample_posts,
        voice_profile=voice_profile,
        has_profile=bool(voice_profile),
        updated_at=persona.updated_at,
    )


# ── Persona routes ──────────────────────────────────────────────────────────────

@app.get("/persona/me", response_model=schemas.PersonaOut)
def get_persona(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    persona = db.query(models.UserPersona).filter(
        models.UserPersona.user_id == current_user.id
    ).first()
    if not persona:
        return schemas.PersonaOut(sample_posts=[], has_profile=False)
    return _persona_to_out(persona)


@app.post("/persona/scrape-linkedin", response_model=schemas.ScrapeLinkedinResponse)
async def scrape_linkedin(
    body: schemas.ScrapeLinkedinRequest,
    current_user: models.User = Depends(auth.get_current_user),
):
    """Scrape recent posts from a public LinkedIn profile using Playwright."""
    result = await scrape_posts(body.profile_url, max_posts=5)
    return schemas.ScrapeLinkedinResponse(posts=result.posts, error=result.error)


@app.post("/persona/save", response_model=schemas.PersonaOut)
async def save_persona(
    body: schemas.PersonaUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    clean_posts = [p.strip() for p in body.sample_posts if p.strip()]

    # Analyse voice with Gemini → returns a dict
    voice_dict = await analyze_voice(clean_posts)
    voice_profile_json = json.dumps(voice_dict) if voice_dict else None

    persona = db.query(models.UserPersona).filter(
        models.UserPersona.user_id == current_user.id
    ).first()

    if persona:
        persona.linkedin_url = body.linkedin_url
        persona.sample_posts_json = json.dumps(clean_posts)
        persona.voice_profile = voice_profile_json
    else:
        persona = models.UserPersona(
            user_id=current_user.id,
            linkedin_url=body.linkedin_url,
            sample_posts_json=json.dumps(clean_posts),
            voice_profile=voice_profile_json,
        )
        db.add(persona)

    db.commit()
    db.refresh(persona)
    app_log.info("persona_saved | user_id=%d | posts=%d", current_user.id, len(clean_posts))
    return _persona_to_out(persona)


# ── Schedule routes ─────────────────────────────────────────────────────────────

@app.post("/posts/schedule", response_model=schemas.ScheduledPostOut, status_code=status.HTTP_201_CREATED)
def schedule_post(
    body: schemas.SchedulePostRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    post = models.ScheduledPost(
        user_id=current_user.id,
        content=body.content,
        platform=body.platform,
        scheduled_for=body.scheduled_for,
        source_label=body.source_label,
        status="pending",
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    app_log.info(
        "post_scheduled | user_id=%d | id=%d | platform=%s | for=%s",
        current_user.id, post.id, post.platform, post.scheduled_for,
    )
    return post


@app.get("/posts/scheduled", response_model=list[schemas.ScheduledPostOut])
def list_scheduled(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return (
        db.query(models.ScheduledPost)
        .filter(
            models.ScheduledPost.user_id == current_user.id,
            models.ScheduledPost.status != "cancelled",
        )
        .order_by(models.ScheduledPost.scheduled_for.asc())
        .all()
    )


@app.patch("/posts/scheduled/{post_id}/status", response_model=schemas.ScheduledPostOut)
def update_scheduled_status(
    post_id: int,
    new_status: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Mark a scheduled post as 'posted' or 'cancelled'."""
    post = db.query(models.ScheduledPost).filter(
        models.ScheduledPost.id == post_id,
        models.ScheduledPost.user_id == current_user.id,
    ).first()
    if not post:
        raise HTTPException(status_code=404, detail="Scheduled post not found")
    if new_status not in ("posted", "cancelled", "pending"):
        raise HTTPException(status_code=400, detail="Invalid status")
    post.status = new_status
    db.commit()
    db.refresh(post)
    return post


# ── Content routes ─────────────────────────────────────────────────────────────

@app.post("/content/repurpose", response_model=schemas.RepurposeResponse)
async def repurpose_content(
    body: schemas.RepurposeRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY is not configured. Add it to your .env file.",
        )

    _deduct_credit(current_user, db)

    timer = Timer()
    app_log.info(
        "repurpose_start | user_id=%d | source_type=%s | platform=%s | tone=%s | url=%s",
        current_user.id, body.source_type, body.platform, body.tone, body.source_url,
    )

    # ── Step 1: Extract content ────────────────────────────────────────────────
    try:
        extracted = await extract_content(body.source_url, body.source_type)
    except ValueError as e:
        app_log.warning("extraction_failed | user_id=%d | error=%s", current_user.id, e)
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        app_log.error("extraction_error | user_id=%d | error=%s", current_user.id, e)
        raise HTTPException(status_code=500, detail=f"Content extraction failed: {e}")

    # ── Step 2: Web search for enrichment ─────────────────────────────────────
    search_query = build_search_query(extracted.title, body.source_type)
    search_results = await search_web(search_query)
    search_context = format_search_context(search_results)

    # ── Step 3: Generate 3 versions concurrently ───────────────────────────────
    user_voice = _get_user_voice(current_user.id, db, user_name=current_user.name)
    try:
        versions = await generate_post(
            content=extracted.content,
            title=extracted.title,
            platform=body.platform,
            tone=body.tone,
            source_type=body.source_type,
            search_context=search_context,
            user_voice=user_voice,
        )
    except google_exceptions.PermissionDenied:
        raise HTTPException(status_code=503, detail="Invalid GEMINI_API_KEY.")
    except google_exceptions.ResourceExhausted:
        raise HTTPException(status_code=429, detail="Gemini API quota exceeded. Please wait and retry.")
    except google_exceptions.GoogleAPIError as e:
        raise HTTPException(status_code=502, detail=f"Gemini API error: {e}")
    # except openai.AuthenticationError: raise HTTPException(503, "Invalid OPENAI_API_KEY.")
    # except openai.RateLimitError:       raise HTTPException(429, "OpenAI rate limit hit.")
    except Exception as e:
        app_log.error("generation_error | user_id=%d | error=%s", current_user.id, e)
        raise HTTPException(status_code=500, detail=f"Post generation failed: {e}")

    # ── Step 4: Persist ────────────────────────────────────────────────────────
    versions_data = [
        {"version": v.version, "angle_id": v.angle_id, "angle_label": v.angle_label, "content": v.content}
        for v in versions
    ]
    post = models.RepurposedPost(
        user_id=current_user.id,
        source_url=body.source_url,
        source_type=body.source_type,
        platform=body.platform,
        tone=body.tone,
        generated_content=versions[0].content,
        versions_json=json.dumps(versions_data),
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    app_log.info(
        "repurpose_done | user_id=%d | post_id=%d | versions=%d | elapsed_ms=%d",
        current_user.id, post.id, len(versions), timer.elapsed_ms,
    )

    return schemas.RepurposeResponse(
        id=post.id,
        source_url=post.source_url,
        source_title=extracted.title,
        platform=post.platform,
        tone=post.tone,
        versions=[
            schemas.PostVersion(
                version=v.version,
                angle_id=v.angle_id,
                angle_label=v.angle_label,
                content=v.content,
            )
            for v in versions
        ],
        generated_content=versions[0].content,
        created_at=post.created_at,
    )


@app.get("/content/history", response_model=list[schemas.RepurposeResponse])
def get_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    posts = (
        db.query(models.RepurposedPost)
        .filter(models.RepurposedPost.user_id == current_user.id)
        .order_by(models.RepurposedPost.created_at.desc())
        .limit(50)
        .all()
    )

    def _to_versions(p: models.RepurposedPost) -> list[schemas.PostVersion]:
        if p.versions_json:
            try:
                raw = json.loads(p.versions_json)
                return [schemas.PostVersion(**v) for v in raw]
            except Exception:
                pass
        # Fallback for old rows without versions_json
        return [schemas.PostVersion(version=1, angle_id="hook_insights", angle_label="Hook & Insights", content=p.generated_content)]

    return [
        schemas.RepurposeResponse(
            id=p.id,
            source_url=p.source_url,
            source_title=None,
            platform=p.platform,
            tone=p.tone,
            versions=_to_versions(p),
            generated_content=p.generated_content,
            created_at=p.created_at,
        )
        for p in posts
    ]


@app.post("/content/from-topic", response_model=schemas.TopicResponse)
async def from_topic(
    body: schemas.TopicRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY is not configured. Add it to your .env file.",
        )

    _deduct_credit(current_user, db)

    timer = Timer()
    app_log.info(
        "from_topic_start | user_id=%d | topic=%r | tone=%s",
        current_user.id, body.topic, body.tone,
    )

    # ── Step 1: Research the topic ─────────────────────────────────────────────
    research = await research_topic(body.topic)

    # ── Step 2: Generate post versions + carousel in parallel ──────────────────
    user_voice = _get_user_voice(current_user.id, db, user_name=current_user.name)
    try:
        versions, carousel_slides = await generate_from_topic(
            topic=body.topic,
            tone=body.tone,
            research_context=research.context_str,
            user_voice=user_voice,
        )
    except google_exceptions.PermissionDenied:
        raise HTTPException(status_code=503, detail="Invalid GEMINI_API_KEY.")
    except google_exceptions.ResourceExhausted:
        raise HTTPException(status_code=429, detail="Gemini API quota exceeded. Please wait and retry.")
    except google_exceptions.GoogleAPIError as e:
        raise HTTPException(status_code=502, detail=f"Gemini API error: {e}")
    # except openai.AuthenticationError: raise HTTPException(503, "Invalid OPENAI_API_KEY.")
    # except openai.RateLimitError:       raise HTTPException(429, "OpenAI rate limit hit.")
    except Exception as e:
        app_log.error("from_topic_error | user_id=%d | error=%s", current_user.id, e)
        raise HTTPException(status_code=500, detail=f"Topic generation failed: {e}")

    app_log.info(
        "from_topic_done | user_id=%d | topic=%r | versions=%d | slides=%d | elapsed_ms=%d",
        current_user.id, body.topic, len(versions), len(carousel_slides), timer.elapsed_ms,
    )

    return schemas.TopicResponse(
        topic=body.topic,
        tone=body.tone,
        versions=[
            schemas.PostVersion(
                version=v.version,
                angle_id=v.angle_id,
                angle_label=v.angle_label,
                content=v.content,
            )
            for v in versions
        ],
        carousel_slides=[
            schemas.CarouselSlide(
                slide_number=s.slide_number,
                slide_type=s.slide_type,
                emoji=s.emoji,
                headline=s.headline,
                subheadline=s.subheadline,
                body=s.body,
            )
            for s in carousel_slides
        ],
        generated_content=versions[0].content if versions else "",
    )


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "Repost AI API",
        "langsmith_tracing": bool(os.getenv("LANGCHAIN_TRACING_V2")),
        "search_enabled": bool(os.getenv("TAVILY_API_KEY")),
    }
