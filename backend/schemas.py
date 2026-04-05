from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    linkedin_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# ── Content ───────────────────────────────────────────────────────────────────

class RepurposeRequest(BaseModel):
    source_url: str
    source_type: str   # youtube | blog | article | podcast
    platform: str      # linkedin | twitter
    tone: str          # thought_leader | casual | storytelling | data_driven | contrarian


class PostVersion(BaseModel):
    version: int
    angle_id: str
    angle_label: str
    content: str


class RepurposeResponse(BaseModel):
    id: Optional[int] = None
    source_url: str
    source_title: Optional[str] = None
    platform: str
    tone: str
    versions: list[PostVersion]
    generated_content: str   # kept for backward compat — always == versions[0].content
    created_at: Optional[datetime] = None


# ── Topic-based content ───────────────────────────────────────────────────────

class CarouselSlide(BaseModel):
    slide_number: int
    slide_type: str       # cover | insight | stat | quote | list | cta
    emoji: str
    headline: str
    subheadline: str
    body: str


class TopicRequest(BaseModel):
    topic: str
    tone: str   # thought_leader | casual | storytelling | data_driven | contrarian


class TopicResponse(BaseModel):
    topic: str
    tone: str
    versions: list[PostVersion]
    carousel_slides: list[CarouselSlide]
    generated_content: str   # = versions[0].content for convenience
