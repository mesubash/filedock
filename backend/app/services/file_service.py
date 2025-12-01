from uuid import UUID
import re
import random
import string
import hashlib
import time
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status, UploadFile

from app.models.file import File, Folder
from app.schemas.file import FileResponse, FileCreate, FileMoveRequest
from app.services.storage_service import storage_service


# Word lists for generating memorable slugs
ADJECTIVES = [
    "swift", "bright", "calm", "bold", "cool", "deep", "fair", "fast", "fine", "free",
    "glad", "good", "keen", "kind", "mild", "neat", "nice", "pure", "rich", "safe",
    "slim", "soft", "true", "warm", "wise", "able", "epic", "mega", "super", "ultra",
    "prime", "elite", "grand", "noble", "royal", "vivid", "lucid", "crisp", "fresh", "sleek"
]

NOUNS = [
    "star", "moon", "wave", "wind", "fire", "leaf", "rose", "snow", "rain", "lake",
    "peak", "rock", "tree", "bird", "fish", "bear", "wolf", "lion", "hawk", "deer",
    "jade", "ruby", "gold", "iron", "sage", "mint", "pine", "palm", "fern", "vine",
    "cloud", "storm", "flame", "spark", "frost", "bloom", "crest", "ridge", "delta", "pulse"
]


def generate_slug(name: str = None, style: str = "readable") -> str:
    """
    Generate a URL-friendly slug.
    
    Styles:
    - "readable": adjective-noun-xxxx (e.g., swift-star-a7b3)
    - "short": xxxx-xxxx (e.g., a7b3-c9d1)
    - "named": cleaned-name-xxxx (e.g., my-document-a7b3)
    """
    # Generate random suffix (4 chars for readability)
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
    
    if style == "readable" or not name:
        # Generate memorable adjective-noun combo
        adj = random.choice(ADJECTIVES)
        noun = random.choice(NOUNS)
        return f"{adj}-{noun}-{suffix}"
    
    elif style == "short":
        # Short random slug
        prefix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
        return f"{prefix}-{suffix}"
    
    else:  # "named" style - use provided name
        # Clean the name
        slug = name.lower().strip()
        slug = re.sub(r'[^a-z0-9\s-]', '', slug)
        slug = re.sub(r'[\s_]+', '-', slug)
        slug = re.sub(r'-+', '-', slug)
        slug = slug.strip('-')
        
        # Truncate if too long (max 30 chars for the name part)
        if len(slug) > 30:
            slug = slug[:30].rstrip('-')
        
        return f"{slug}-{suffix}" if slug else f"file-{suffix}"


def detect_file_type(content_type: str, filename: str) -> str:
    """Detect file type category based on content type or extension"""
    if not content_type:
        content_type = ""
    
    content_type = content_type.lower()
    filename = filename.lower()
    
    # Image types
    if content_type.startswith('image/') or any(filename.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico']):
        return "image"
    
    # Video types
    if content_type.startswith('video/') or any(filename.endswith(ext) for ext in ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv']):
        return "video"
    
    # Audio types
    if content_type.startswith('audio/') or any(filename.endswith(ext) for ext in ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a']):
        return "audio"
    
    # Document types
    if any(filename.endswith(ext) for ext in ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.odt', '.ods', '.odp', '.csv', '.md']):
        return "document"
    if 'pdf' in content_type or 'document' in content_type or 'spreadsheet' in content_type or 'presentation' in content_type:
        return "document"
    
    # Archive types
    if any(filename.endswith(ext) for ext in ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2']):
        return "archive"
    if 'zip' in content_type or 'compressed' in content_type or 'archive' in content_type:
        return "archive"
    
    return "other"


class FileService:
    def __init__(self, db: Session):
        self.db = db

    async def upload_file(
        self,
        file: UploadFile,
        is_public: bool,
        user_id: int,
        custom_name: str = None,
        description: str = None,
        file_type: str = None,
        tags: str = None,
        folder_id: Optional[UUID] = None
    ) -> FileResponse:
        """Upload a file and create DB record"""
        # Validate folder exists if specified
        if folder_id:
            folder = self.db.query(Folder).filter(Folder.id == folder_id).first()
            if not folder:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Folder not found"
                )
        
        # Read file content
        content = await file.read()
        file_size = len(content)
        
        # Generate storage key
        storage_key = storage_service.generate_storage_key(file.filename)
        
        # Generate slug for public files
        slug = None
        if is_public:
            # Use custom name with "named" style, or generate readable slug
            if custom_name:
                slug = generate_slug(custom_name, style="named")
            else:
                slug = generate_slug(style="readable")
            
            # Ensure slug is unique
            while self.db.query(File).filter(File.slug == slug).first():
                if custom_name:
                    slug = generate_slug(custom_name, style="named")
                else:
                    slug = generate_slug(style="readable")
        
        # Auto-detect file type if not provided
        detected_type = file_type if file_type else detect_file_type(file.content_type, file.filename)
        
        # Upload to storage
        await storage_service.upload_file(
            file_content=content,
            storage_key=storage_key,
            content_type=file.content_type or "application/octet-stream"
        )
        
        # Create DB record
        db_file = File(
            original_name=file.filename,
            slug=slug,
            storage_key=storage_key,
            size=file_size,
            content_type=file.content_type,
            is_public=is_public,
            description=description,
            file_type=detected_type,
            tags=tags,
            folder_id=folder_id,
            uploaded_by=user_id
        )
        
        self.db.add(db_file)
        self.db.commit()
        self.db.refresh(db_file)
        
        return self._to_response(db_file)

    def list_files(
        self, 
        page: int = 1, 
        per_page: int = 20,
        file_type: str = None,
        is_public: bool = None,
        search: str = None,
        tags: str = None,
        folder_id: Optional[UUID] = None,
        user_id: int = None,
        is_admin: bool = False
    ) -> tuple[list[FileResponse], int]:
        """List files with pagination and filtering. Non-admins only see their own files."""
        query = self.db.query(File)
        
        # Non-admins can only see their own files
        if not is_admin and user_id:
            query = query.filter(File.uploaded_by == user_id)
        
        # Apply filters
        if file_type:
            query = query.filter(File.file_type == file_type)
        
        if is_public is not None:
            query = query.filter(File.is_public == is_public)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    File.original_name.ilike(search_term),
                    File.description.ilike(search_term),
                    File.tags.ilike(search_term)
                )
            )
        
        if tags:
            # Filter by tags (comma-separated)
            tag_list = [t.strip() for t in tags.split(',')]
            for tag in tag_list:
                query = query.filter(File.tags.ilike(f"%{tag}%"))
        
        # Filter by folder (None means root level when explicitly set)
        if folder_id is not None:
            query = query.filter(File.folder_id == folder_id)
        
        total = query.count()
        offset = (page - 1) * per_page
        
        files = query\
            .order_by(File.created_at.desc())\
            .offset(offset)\
            .limit(per_page)\
            .all()
        
        return [self._to_response(f) for f in files], total

    def move_file(self, file_id: UUID, folder_id: Optional[UUID], user_id: int = None, is_admin: bool = False) -> FileResponse:
        """Move file to a different folder or to root (folder_id=None)"""
        db_file = self.db.query(File).filter(File.id == file_id).first()
        
        if not db_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        # Non-admins can only move their own files
        if not is_admin and db_file.uploaded_by != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to move this file"
            )
        
        # Validate target folder exists if specified
        if folder_id:
            folder = self.db.query(Folder).filter(Folder.id == folder_id).first()
            if not folder:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Target folder not found"
                )
            # Non-admins can only move to their own folders
            if not is_admin and folder.created_by != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have permission to move files to this folder"
                )
        
        db_file.folder_id = folder_id
        self.db.commit()
        self.db.refresh(db_file)
        
        return self._to_response(db_file)

    def get_file_by_id(self, file_id: UUID, user_id: int = None, is_admin: bool = False) -> FileResponse:
        """Get file metadata by ID"""
        db_file = self.db.query(File).filter(File.id == file_id).first()
        
        if not db_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        # Non-admins can only see their own files
        if not is_admin and db_file.uploaded_by != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this file"
            )
        
        return self._to_response(db_file)

    def get_file_record_by_id(self, file_id: UUID, user_id: int = None, is_admin: bool = False) -> File:
        """Get raw file record by ID"""
        db_file = self.db.query(File).filter(File.id == file_id).first()
        
        if not db_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        # Non-admins can only access their own files
        if not is_admin and db_file.uploaded_by != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to access this file"
            )
        
        return db_file

    def get_file_by_storage_key(self, storage_key: str) -> File:
        """Get file by storage key"""
        db_file = self.db.query(File).filter(File.storage_key == storage_key).first()
        
        if not db_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        return db_file

    def get_file_by_slug(self, slug: str) -> File:
        """Get file by slug (for public files)"""
        db_file = self.db.query(File).filter(File.slug == slug).first()
        
        if not db_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        return db_file

    async def delete_file(self, file_id: UUID, user_id: int = None, is_admin: bool = False) -> bool:
        """Delete file from storage and DB"""
        db_file = self.db.query(File).filter(File.id == file_id).first()
        
        if not db_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        # Non-admins can only delete their own files
        if not is_admin and db_file.uploaded_by != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete this file"
            )
        
        # Delete from storage
        await storage_service.delete_file(db_file.storage_key)
        
        # Delete from DB
        self.db.delete(db_file)
        self.db.commit()
        
        return True

    def update_file(self, file_id: UUID, description: str = None, tags: str = None, file_type: str = None, user_id: int = None, is_admin: bool = False) -> FileResponse:
        """Update file metadata"""
        db_file = self.db.query(File).filter(File.id == file_id).first()
        
        if not db_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        # Non-admins can only update their own files
        if not is_admin and db_file.uploaded_by != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to update this file"
            )
        
        if description is not None:
            db_file.description = description
        if tags is not None:
            db_file.tags = tags
        if file_type is not None:
            db_file.file_type = file_type
        
        self.db.commit()
        self.db.refresh(db_file)
        
        return self._to_response(db_file)

    def update_file_visibility(
        self, 
        file_id: UUID, 
        is_public: bool = None,
        description: str = None, 
        tags: str = None, 
        file_type: str = None,
        custom_name: str = None,
        user_id: int = None,
        is_admin: bool = False
    ) -> FileResponse:
        """Update file visibility and metadata. Generates slug when making public."""
        db_file = self.db.query(File).filter(File.id == file_id).first()
        
        if not db_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        # Non-admins can only update their own files
        if not is_admin and db_file.uploaded_by != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to update this file"
            )
        
        # Handle visibility change
        if is_public is not None:
            if is_public and not db_file.is_public:
                # Making file public - generate readable slug
                base_name = custom_name if custom_name else db_file.original_name.rsplit('.', 1)[0]
                slug = generate_slug(base_name, style='readable')
                
                # Ensure slug is unique
                while self.db.query(File).filter(File.slug == slug).first():
                    slug = generate_slug(base_name, style='readable')
                
                db_file.slug = slug
                db_file.is_public = True
            elif not is_public and db_file.is_public:
                # Making file private - remove slug
                db_file.slug = None
                db_file.is_public = False
        
        # Update other metadata
        if description is not None:
            db_file.description = description
        if tags is not None:
            db_file.tags = tags
        if file_type is not None:
            db_file.file_type = file_type
        
        self.db.commit()
        self.db.refresh(db_file)
        
        return self._to_response(db_file)

    def _to_response(self, db_file: File) -> FileResponse:
        """Convert DB model to response schema"""
        public_url = None
        download_url = f"/api/files/download/{db_file.id}"
        
        if db_file.is_public and db_file.slug:
            public_url = f"/api/public/{db_file.slug}"
        
        return FileResponse(
            id=db_file.id,
            original_name=db_file.original_name,
            slug=db_file.slug,
            storage_key=db_file.storage_key,
            size=db_file.size,
            content_type=db_file.content_type,
            is_public=db_file.is_public,
            description=db_file.description,
            file_type=db_file.file_type,
            tags=db_file.tags,
            folder_id=db_file.folder_id,
            uploaded_by=db_file.uploaded_by,
            created_at=db_file.created_at,
            updated_at=db_file.updated_at,
            public_url=public_url,
            download_url=download_url
        )
