from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import schemas
import auth
from database import engine, get_db

# Create tables on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Repost AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Auth routes ───────────────────────────────────────────────────────────────

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

    token = auth.create_access_token(user.id, user.email)
    return schemas.Token(access_token=token, token_type="bearer", user=user)


@app.post("/auth/login", response_model=schemas.Token)
def login(body: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user or not auth.verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = auth.create_access_token(user.id, user.email)
    return schemas.Token(access_token=token, token_type="bearer", user=user)


@app.get("/auth/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


# ── Content routes ─────────────────────────────────────────────────────────────

TONE_PROMPTS = {
    "thought_leader": "thought leadership — authoritative, insightful, educational",
    "casual":         "casual and conversational — approachable, friendly, relatable",
    "storytelling":   "storytelling — narrative arc, personal angle, emotional hook",
    "data_driven":    "data-driven — statistics, evidence, analytical insights",
    "contrarian":     "contrarian — challenges conventional wisdom, bold take",
}

MOCK_POSTS = {
    "linkedin": (
        "I just went deep on this resource and it completely shifted how I think about this space.\n\n"
        "Here's what stood out:\n\n"
        "→ The conventional wisdom is wrong. Most people focus on the output, not the inputs that drive it.\n\n"
        "→ The best practitioners do one counterintuitive thing differently: they slow down before they speed up.\n\n"
        "→ The real leverage isn't in the tools — it's in how clearly you define the problem.\n\n"
        "The lesson? Stop optimizing for speed. Optimize for clarity first.\n\n"
        "What's one thing in your work where you've been optimizing for the wrong metric?\n\n"
        "#buildinpublic #startups #productthinking #founders"
    ),
    "twitter": (
        "Thread: I just analyzed this resource and here are 7 things that will change how you think about this 🧵\n\n"
        "1/ Most people get this completely wrong. They focus on the visible output and miss the underlying system.\n\n"
        "2/ The top performers in this space share one trait: they ask \"why\" 3 more times than everyone else.\n\n"
        "3/ The biggest leverage point isn't what you think. It's not the tools or the tactics — it's the mental model.\n\n"
        "4/ Here's the counterintuitive part: doing less, more deliberately, outperforms doing more, faster.\n\n"
        "5/ The data backs this up. Focused practitioners ship 40% less but with 3x the impact per unit of work.\n\n"
        "6/ Practical takeaway: audit your last week. How much was high-leverage vs. just busy work?\n\n"
        "7/ The compounding effect of consistently choosing depth over breadth is enormous over 12 months.\n\n"
        "Save this thread. What would you add? 👇"
    ),
}


@app.post("/content/repurpose", response_model=schemas.RepurposeResponse)
def repurpose_content(
    body: schemas.RepurposeRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    # TODO: replace with real LLM call (OpenAI / Claude)
    generated = MOCK_POSTS.get(body.platform, MOCK_POSTS["linkedin"])

    post = models.RepurposedPost(
        user_id=current_user.id,
        source_url=body.source_url,
        source_type=body.source_type,
        platform=body.platform,
        tone=body.tone,
        generated_content=generated,
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    return schemas.RepurposeResponse(
        id=post.id,
        source_url=post.source_url,
        platform=post.platform,
        tone=post.tone,
        generated_content=post.generated_content,
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
    return posts


@app.get("/health")
def health():
    return {"status": "ok", "service": "Repost AI API"}
