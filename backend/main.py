from dotenv import load_dotenv
load_dotenv()  # Load .env before anything else reads env vars

import os
import anthropic as anthropic_sdk
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import schemas
import auth
from database import engine, get_db
from content_extractor import extract as extract_content
from llm import generate_post

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

    # Step 1: Extract content from the URL
    try:
        extracted = await extract_content(body.source_url, body.source_type)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Content extraction failed: {e}")

    # Step 2: Generate post with LLM
    try:
        generated = await generate_post(
            content=extracted.content,
            title=extracted.title,
            platform=body.platform,
            tone=body.tone,
            source_type=body.source_type,
        )
    except anthropic_sdk.AuthenticationError:
        raise HTTPException(status_code=503, detail="Invalid ANTHROPIC_API_KEY. Check your .env file.")
    except anthropic_sdk.RateLimitError:
        raise HTTPException(status_code=429, detail="Claude API rate limit hit. Please wait a moment and try again.")
    except anthropic_sdk.APIError as e:
        raise HTTPException(status_code=502, detail=f"Claude API error: {e.message}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Post generation failed: {e}")

    # Step 3: Persist to DB
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
        source_title=extracted.title,
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
    return [
        schemas.RepurposeResponse(
            id=p.id,
            source_url=p.source_url,
            source_title=None,
            platform=p.platform,
            tone=p.tone,
            generated_content=p.generated_content,
            created_at=p.created_at,
        )
        for p in posts
    ]


@app.get("/health")
def health():
    return {"status": "ok", "service": "Repost AI API"}
