from uuid import UUID
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.file import (
    FolderCreate, 
    FolderUpdate, 
    FolderResponse, 
    FolderWithContents,
    FolderBreadcrumb,
    FolderTreeNode
)
from app.services.folder_service import FolderService

router = APIRouter()


@router.post("", response_model=FolderResponse)
def create_folder(
    folder_data: FolderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new folder"""
    folder_service = FolderService(db)
    return folder_service.create_folder(folder_data, current_user.id)


@router.get("/tree", response_model=List[FolderTreeNode])
def get_folder_tree(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get complete folder tree structure"""
    folder_service = FolderService(db)
    return folder_service.get_folder_tree()


@router.get("/contents", response_model=FolderWithContents)
def get_folder_contents(
    folder_id: Optional[UUID] = Query(None, description="Folder ID, or omit for root level"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get folder contents (subfolders and files). Omit folder_id for root level."""
    folder_service = FolderService(db)
    return folder_service.get_folder_contents(folder_id)


@router.get("/{folder_id}", response_model=FolderResponse)
def get_folder(
    folder_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get folder by ID"""
    folder_service = FolderService(db)
    return folder_service.get_folder(folder_id)


@router.get("/{folder_id}/breadcrumbs", response_model=List[FolderBreadcrumb])
def get_breadcrumbs(
    folder_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get breadcrumb path from root to folder"""
    folder_service = FolderService(db)
    return folder_service.get_breadcrumbs(folder_id)


@router.put("/{folder_id}", response_model=FolderResponse)
def update_folder(
    folder_id: UUID,
    folder_data: FolderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update folder name or move to different parent"""
    folder_service = FolderService(db)
    return folder_service.update_folder(folder_id, folder_data)


@router.delete("/{folder_id}")
async def delete_folder(
    folder_id: UUID,
    recursive: bool = Query(True, description="Delete all contents recursively"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete folder. Set recursive=true to delete all contents."""
    folder_service = FolderService(db)
    await folder_service.delete_folder(folder_id, recursive)
    return {"message": "Folder deleted successfully"}
