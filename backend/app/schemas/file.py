from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional, List


# ============ Folder Schemas ============

class FolderCreate(BaseModel):
    name: str
    parent_id: Optional[UUID] = None


class FolderUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[UUID] = None


class FolderResponse(BaseModel):
    id: UUID
    name: str
    parent_id: Optional[UUID] = None
    created_by: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    file_count: int = 0
    subfolder_count: int = 0

    class Config:
        from_attributes = True


class FolderWithContents(FolderResponse):
    subfolders: List["FolderResponse"] = []
    files: List["FileResponse"] = []


class FolderBreadcrumb(BaseModel):
    id: UUID
    name: str


class FolderTreeNode(BaseModel):
    id: UUID
    name: str
    children: List["FolderTreeNode"] = []


# ============ File Schemas ============

class FileBase(BaseModel):
    original_name: str
    is_public: bool = False


class FileCreate(FileBase):
    storage_key: str
    slug: Optional[str] = None
    size: int
    content_type: Optional[str] = None
    description: Optional[str] = None
    file_type: Optional[str] = None
    tags: Optional[str] = None
    folder_id: Optional[UUID] = None
    uploaded_by: int


class FileResponse(BaseModel):
    id: UUID
    original_name: str
    slug: Optional[str] = None
    storage_key: str
    size: int
    content_type: Optional[str] = None
    is_public: bool
    description: Optional[str] = None
    file_type: Optional[str] = None
    tags: Optional[str] = None
    folder_id: Optional[UUID] = None
    uploaded_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    public_url: Optional[str] = None
    download_url: Optional[str] = None

    class Config:
        from_attributes = True


class FileListResponse(BaseModel):
    files: list[FileResponse]
    total: int
    page: int
    per_page: int


class FileUploadResponse(FileResponse):
    pass


class FileMoveRequest(BaseModel):
    folder_id: Optional[UUID] = None  # None means move to root


class FileUpdateRequest(BaseModel):
    """Request to update file metadata and visibility"""
    is_public: Optional[bool] = None
    description: Optional[str] = None
    file_type: Optional[str] = None
    tags: Optional[str] = None
    custom_name: Optional[str] = None  # For generating new slug when making public


# File type categories
FILE_TYPES = ["document", "image", "video", "audio", "archive", "other"]


# Update forward references
FolderWithContents.model_rebuild()
FolderTreeNode.model_rebuild()
