from uuid import UUID
from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, Path
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
from io import BytesIO
from typing import Optional

from app.core.database import get_db
from app.schemas.file import FileResponse, FileListResponse, FileMoveRequest, FileUpdateRequest
from app.services.file_service import FileService
from app.services.storage_service import storage_service
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/upload", response_model=FileResponse)
async def upload_file(
    file: UploadFile = File(...),
    is_public: bool = Form(False),
    custom_name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    file_type: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    folder_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a new file with metadata. 
    - custom_name: For public files, creates a friendly URL slug
    - description: File description
    - file_type: Category (document, image, video, audio, archive, other) - auto-detected if not provided
    - tags: Comma-separated tags for filtering
    - folder_id: Target folder UUID (optional, omit for root level)
    """
    file_service = FileService(db)
    return await file_service.upload_file(
        file=file,
        is_public=is_public,
        user_id=current_user.id,
        custom_name=custom_name,
        description=description,
        file_type=file_type,
        tags=tags,
        folder_id=UUID(folder_id) if folder_id else None
    )


@router.get("", response_model=FileListResponse)
def list_files(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    file_type: Optional[str] = Query(None, description="Filter by type: document, image, video, audio, archive, other"),
    is_public: Optional[bool] = Query(None, description="Filter by visibility"),
    search: Optional[str] = Query(None, description="Search in name, description, tags"),
    tags: Optional[str] = Query(None, description="Filter by tags (comma-separated)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all files with pagination and filtering"""
    file_service = FileService(db)
    files, total = file_service.list_files(
        page=page, 
        per_page=per_page,
        file_type=file_type,
        is_public=is_public,
        search=search,
        tags=tags
    )
    return FileListResponse(
        files=files,
        total=total,
        page=page,
        per_page=per_page
    )


@router.get("/{file_id}", response_model=FileResponse)
def get_file(
    file_id: UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get file metadata by ID (Admin only)"""
    file_service = FileService(db)
    return file_service.get_file_by_id(file_id)


@router.put("/{file_id}/move", response_model=FileResponse)
def move_file(
    file_id: UUID = Path(...),
    move_request: FileMoveRequest = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Move a file to a different folder. Set folder_id to null to move to root."""
    file_service = FileService(db)
    return file_service.move_file(file_id, move_request.folder_id if move_request else None)


@router.put("/{file_id}", response_model=FileResponse)
def update_file(
    file_id: UUID = Path(...),
    update_request: FileUpdateRequest = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update file metadata and visibility. Use this to toggle public/private."""
    file_service = FileService(db)
    return file_service.update_file_visibility(
        file_id=file_id,
        is_public=update_request.is_public if update_request else None,
        description=update_request.description if update_request else None,
        file_type=update_request.file_type if update_request else None,
        tags=update_request.tags if update_request else None,
        custom_name=update_request.custom_name if update_request else None
    )


@router.delete("/{file_id}")
async def delete_file(
    file_id: UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a file (Admin only)"""
    file_service = FileService(db)
    await file_service.delete_file(file_id)
    return {"message": "File deleted successfully"}


@router.get("/download/{file_id}")
async def download_file(
    file_id: UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download a file (Admin can download both public and private files)"""
    file_service = FileService(db)
    file_record = file_service.get_file_record_by_id(file_id)
    
    content, content_type = await storage_service.get_file(file_record.storage_key)
    
    return Response(
        content=content,
        media_type=file_record.content_type or content_type,
        headers={
            "Content-Disposition": f'attachment; filename="{file_record.original_name}"',
            "Content-Length": str(len(content))
        }
    )


@router.get("/view/{file_id}")
async def view_file(
    file_id: UUID = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """View a file inline (Admin can view both public and private files)"""
    file_service = FileService(db)
    file_record = file_service.get_file_record_by_id(file_id)
    
    content, content_type = await storage_service.get_file(file_record.storage_key)
    
    return Response(
        content=content,
        media_type=file_record.content_type or content_type,
        headers={
            "Content-Disposition": f'inline; filename="{file_record.original_name}"',
            "Content-Length": str(len(content))
        }
    )
