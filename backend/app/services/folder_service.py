from uuid import UUID
from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.file import Folder, File
from app.schemas.file import FolderCreate, FolderUpdate, FolderResponse, FolderWithContents, FolderBreadcrumb, FolderTreeNode
from app.services.storage_service import storage_service


class FolderService:
    def __init__(self, db: Session):
        self.db = db

    def create_folder(self, folder_data: FolderCreate, user_id: int) -> FolderResponse:
        """Create a new folder"""
        # Validate parent exists if specified
        if folder_data.parent_id:
            parent = self.db.query(Folder).filter(Folder.id == folder_data.parent_id).first()
            if not parent:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent folder not found"
                )
        
        # Check for duplicate name in same parent
        existing = self.db.query(Folder).filter(
            Folder.name == folder_data.name,
            Folder.parent_id == folder_data.parent_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A folder with this name already exists in this location"
            )
        
        folder = Folder(
            name=folder_data.name,
            parent_id=folder_data.parent_id,
            created_by=user_id
        )
        
        self.db.add(folder)
        self.db.commit()
        self.db.refresh(folder)
        
        return self._to_response(folder)

    def get_folder(self, folder_id: UUID) -> FolderResponse:
        """Get folder by ID"""
        folder = self.db.query(Folder).filter(Folder.id == folder_id).first()
        
        if not folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folder not found"
            )
        
        return self._to_response(folder)

    def get_folder_contents(self, folder_id: Optional[UUID] = None) -> FolderWithContents:
        """Get folder contents including subfolders and files"""
        from app.services.file_service import FileService
        file_service = FileService(self.db)
        
        if folder_id:
            folder = self.db.query(Folder).filter(Folder.id == folder_id).first()
            if not folder:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Folder not found"
                )
            
            # Get subfolders
            subfolders = self.db.query(Folder).filter(Folder.parent_id == folder_id).order_by(Folder.name).all()
            
            # Get files in this folder
            files = self.db.query(File).filter(File.folder_id == folder_id).order_by(File.original_name).all()
            
            return FolderWithContents(
                id=folder.id,
                name=folder.name,
                parent_id=folder.parent_id,
                created_by=folder.created_by,
                created_at=folder.created_at,
                updated_at=folder.updated_at,
                file_count=len(files),
                subfolder_count=len(subfolders),
                subfolders=[self._to_response(sf) for sf in subfolders],
                files=[file_service._to_response(f) for f in files]
            )
        else:
            # Root level - get folders and files with no parent
            subfolders = self.db.query(Folder).filter(Folder.parent_id == None).order_by(Folder.name).all()
            files = self.db.query(File).filter(File.folder_id == None).order_by(File.original_name).all()
            
            return FolderWithContents(
                id=UUID('00000000-0000-0000-0000-000000000000'),  # Dummy ID for root
                name="Root",
                parent_id=None,
                created_by=0,
                created_at=None,
                updated_at=None,
                file_count=len(files),
                subfolder_count=len(subfolders),
                subfolders=[self._to_response(sf) for sf in subfolders],
                files=[file_service._to_response(f) for f in files]
            )

    def list_folders(self, parent_id: Optional[UUID] = None) -> List[FolderResponse]:
        """List all folders in a parent (or root if parent_id is None)"""
        query = self.db.query(Folder)
        
        if parent_id:
            query = query.filter(Folder.parent_id == parent_id)
        else:
            query = query.filter(Folder.parent_id == None)
        
        folders = query.order_by(Folder.name).all()
        return [self._to_response(f) for f in folders]

    def update_folder(self, folder_id: UUID, folder_data: FolderUpdate) -> FolderResponse:
        """Update folder name or move to different parent"""
        folder = self.db.query(Folder).filter(Folder.id == folder_id).first()
        
        if not folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folder not found"
            )
        
        # Check for circular reference if moving
        if folder_data.parent_id is not None:
            if folder_data.parent_id == folder_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot move folder into itself"
                )
            
            # Check if new parent is a descendant of this folder
            if self._is_descendant(folder_id, folder_data.parent_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot move folder into its own subfolder"
                )
            
            folder.parent_id = folder_data.parent_id
        
        if folder_data.name:
            # Check for duplicate name in new location
            parent_id = folder_data.parent_id if folder_data.parent_id is not None else folder.parent_id
            existing = self.db.query(Folder).filter(
                Folder.name == folder_data.name,
                Folder.parent_id == parent_id,
                Folder.id != folder_id
            ).first()
            
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A folder with this name already exists in this location"
                )
            
            folder.name = folder_data.name
        
        self.db.commit()
        self.db.refresh(folder)
        
        return self._to_response(folder)

    async def delete_folder(self, folder_id: UUID, recursive: bool = True) -> bool:
        """Delete folder. If recursive=True, delete all contents including subfolders and files."""
        folder = self.db.query(Folder).filter(Folder.id == folder_id).first()
        
        if not folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folder not found"
            )
        
        if recursive:
            # Delete all files in this folder and subfolders
            await self._delete_folder_contents(folder)
        else:
            # Check if folder has contents
            has_files = self.db.query(File).filter(File.folder_id == folder_id).first()
            has_subfolders = self.db.query(Folder).filter(Folder.parent_id == folder_id).first()
            
            if has_files or has_subfolders:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Folder is not empty. Use recursive=true to delete contents."
                )
        
        self.db.delete(folder)
        self.db.commit()
        
        return True

    async def _delete_folder_contents(self, folder: Folder):
        """Recursively delete folder contents"""
        # Delete files in this folder
        files = self.db.query(File).filter(File.folder_id == folder.id).all()
        for file in files:
            await storage_service.delete_file(file.storage_key)
            self.db.delete(file)
        
        # Recursively delete subfolders
        subfolders = self.db.query(Folder).filter(Folder.parent_id == folder.id).all()
        for subfolder in subfolders:
            await self._delete_folder_contents(subfolder)
            self.db.delete(subfolder)

    def get_breadcrumbs(self, folder_id: UUID) -> List[FolderBreadcrumb]:
        """Get breadcrumb path from root to folder"""
        breadcrumbs = []
        current_id = folder_id
        
        while current_id:
            folder = self.db.query(Folder).filter(Folder.id == current_id).first()
            if not folder:
                break
            breadcrumbs.insert(0, FolderBreadcrumb(id=folder.id, name=folder.name))
            current_id = folder.parent_id
        
        return breadcrumbs

    def get_folder_tree(self) -> List[FolderTreeNode]:
        """Get complete folder tree structure"""
        root_folders = self.db.query(Folder).filter(Folder.parent_id == None).order_by(Folder.name).all()
        return [self._build_tree_node(f) for f in root_folders]

    def _build_tree_node(self, folder: Folder) -> FolderTreeNode:
        """Recursively build tree node"""
        children = self.db.query(Folder).filter(Folder.parent_id == folder.id).order_by(Folder.name).all()
        return FolderTreeNode(
            id=folder.id,
            name=folder.name,
            children=[self._build_tree_node(c) for c in children]
        )

    def _is_descendant(self, parent_id: UUID, check_id: UUID) -> bool:
        """Check if check_id is a descendant of parent_id"""
        descendants = self.db.query(Folder).filter(Folder.parent_id == parent_id).all()
        for desc in descendants:
            if desc.id == check_id:
                return True
            if self._is_descendant(desc.id, check_id):
                return True
        return False

    def _to_response(self, folder: Folder) -> FolderResponse:
        """Convert folder model to response"""
        file_count = self.db.query(File).filter(File.folder_id == folder.id).count()
        subfolder_count = self.db.query(Folder).filter(Folder.parent_id == folder.id).count()
        
        return FolderResponse(
            id=folder.id,
            name=folder.name,
            parent_id=folder.parent_id,
            created_by=folder.created_by,
            created_at=folder.created_at,
            updated_at=folder.updated_at,
            file_count=file_count,
            subfolder_count=subfolder_count
        )
