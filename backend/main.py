from dotenv import load_dotenv
load_dotenv()  # Must run before any os.getenv() calls

import json
import os

import anthropic as anthropic_sdk
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

import models
import schemas
import auth
from database import engine, get_db
from content_extractor import extract as extract_content
from llm import generate_post
from logger import Timer, app_log, setup_logging
from search import build_search_query, format_search_context, search_web

# ── Startup ────────────────────────────────────────────────────────────────────

setup_logging()
models.Base.metadata.create_all(bind=engine)


def _run_migrations() -> None:
    """Add new columns to existing databases without dropping data."""
    migrations = [
        "ALTER TABLE repurposed_posts ADD COLUMN versions_json TEXT",
    ]
    with engine.connect() as conn:
        for stmt in migrations:
            try:
                conn.execute(text(stmt))
                conn.commit()
                app_log.info("migration | applied: %s", stmt)
            except Exception:
                pass  # Column already exists — safe to ignore


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


# ── Content routes ─────────────────────────────────────────────────────────────

@app.post("/content/repurpose", response_model=schemas.RepurposeResponse)
async def repurpose_content(
    body: schemas.RepurposeRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if not os.getenv("ANTHROPIC_API_KEY"):
        raise HTTPException(
            status_code=503,
            detail="ANTHROPIC_API_KEY is not configured. Add it to your .env file.",
        )

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
    try:
        versions = await generate_post(
            content=extracted.content,
            title=extracted.title,
            platform=body.platform,
            tone=body.tone,
            source_type=body.source_type,
            search_context=search_context,
        )
    except anthropic_sdk.AuthenticationError:
        raise HTTPException(status_code=503, detail="Invalid ANTHROPIC_API_KEY.")
    except anthropic_sdk.RateLimitError:
        raise HTTPException(status_code=429, detail="Claude API rate limit hit. Please wait and retry.")
    except anthropic_sdk.APIError as e:
        raise HTTPException(status_code=502, detail=f"Claude API error: {e.message}")
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


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "Repost AI API",
        "langsmith_tracing": bool(os.getenv("LANGCHAIN_TRACING_V2")),
        "search_enabled": bool(os.getenv("TAVILY_API_KEY")),
    }
