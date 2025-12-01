import uuid
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, BigInteger, Text
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Folder(Base):
    __tablename__ = "folders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("folders.id"), nullable=True)  # Null for root folders
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    parent = relationship("Folder", remote_side=[id], backref="subfolders")
    creator = relationship("User", backref="folders")
    files = relationship("File", back_populates="folder", cascade="all, delete-orphan")


class File(Base):
    __tablename__ = "files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    original_name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=True)  # Friendly URL slug for public files
    storage_key = Column(String, unique=True, nullable=False)
    size = Column(BigInteger, nullable=False)
    content_type = Column(String, nullable=True)
    is_public = Column(Boolean, default=False)
    
    # Folder relationship
    folder_id = Column(UUID(as_uuid=True), ForeignKey("folders.id"), nullable=True)  # Null for root-level files
    
    # Metadata fields
    description = Column(Text, nullable=True)  # File description
    file_type = Column(String, nullable=True)  # Category: document, image, video, audio, archive, other
    tags = Column(String, nullable=True)  # Comma-separated tags for filtering
    
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    uploader = relationship("User", backref="files")
    folder = relationship("Folder", back_populates="files")
