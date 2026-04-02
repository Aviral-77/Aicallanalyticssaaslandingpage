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


class RepurposeResponse(BaseModel):
    id: Optional[int] = None
    source_url: str
    source_title: Optional[str] = None
    platform: str
    tone: str
    generated_content: str
    created_at: Optional[datetime] = None
