from fastapi import APIRouter, Depends, Path, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.file_service import FileService
from app.services.storage_service import storage_service

router = APIRouter()


@router.get("/{slug}")
async def get_public_file(
    slug: str = Path(...),
    db: Session = Depends(get_db)
):
    """Download a public file by slug - no authentication required"""
    file_service = FileService(db)
    
    # Get file record by slug
    file_record = file_service.get_file_by_slug(slug)
    
    # Check if file is public
    if not file_record.is_public:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This file is not publicly accessible"
        )
    
    # Get file content from storage
    content, content_type = await storage_service.get_file(file_record.storage_key)
    
    return Response(
        content=content,
        media_type=file_record.content_type or content_type,
        headers={
            "Content-Disposition": f'inline; filename="{file_record.original_name}"',
            "Content-Length": str(len(content))
        }
    )
