from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    linkedin_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class RepurposedPost(Base):
    __tablename__ = "repurposed_posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    source_url = Column(String(2048), nullable=False)
    source_type = Column(String(50), nullable=False)   # youtube | blog | article | podcast
    platform = Column(String(50), nullable=False)       # linkedin | twitter
    tone = Column(String(100), nullable=False)
    generated_content = Column(Text, nullable=False)    # first version (backward compat)
    versions_json = Column(Text, nullable=True)         # JSON array of PostVersion dicts
    created_at = Column(DateTime(timezone=True), server_default=func.now())
