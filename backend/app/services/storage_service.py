import uuid
import os
from typing import BinaryIO, AsyncGenerator
import boto3
from botocore.exceptions import ClientError
from botocore.config import Config
from fastapi import HTTPException, status

from app.core.config import settings


class StorageService:
    def __init__(self):
        # Use Garage/S3 storage if credentials are configured
        self.use_local = not settings.STORAGE_ACCESS_KEY
        self.local_storage_path = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
        self.storage_prefix = settings.STORAGE_PREFIX  # e.g., "filedock"
        
        if self.use_local:
            os.makedirs(self.local_storage_path, exist_ok=True)
        else:
            # Configure boto3 for Garage S3-compatible storage
            self.s3_client = boto3.client(
                's3',
                endpoint_url=settings.STORAGE_ENDPOINT,
                aws_access_key_id=settings.STORAGE_ACCESS_KEY,
                aws_secret_access_key=settings.STORAGE_SECRET_KEY,
                region_name=settings.STORAGE_REGION,
                config=Config(signature_version='s3v4')
            )
            self.bucket = settings.STORAGE_BUCKET

    def generate_storage_key(self, original_filename: str) -> str:
        """Generate a unique storage key for the file with prefix structure:
        {prefix}/files/{uuid}-{filename}
        e.g., filedock/files/abc123-document.pdf
        """
        unique_id = uuid.uuid4()
        # Sanitize filename
        safe_filename = original_filename.replace(" ", "_")
        return f"{self.storage_prefix}/files/{unique_id}-{safe_filename}"

    async def upload_file(self, file_content: bytes, storage_key: str, content_type: str) -> bool:
        """Upload file to storage"""
        try:
            if self.use_local:
                file_path = os.path.join(self.local_storage_path, storage_key.replace("/", "_"))
                with open(file_path, "wb") as f:
                    f.write(file_content)
                return True
            else:
                self.s3_client.put_object(
                    Bucket=self.bucket,
                    Key=storage_key,
                    Body=file_content,
                    ContentType=content_type
                )
                return True
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload file: {str(e)}"
            )

    async def delete_file(self, storage_key: str) -> bool:
        """Delete file from storage"""
        try:
            if self.use_local:
                file_path = os.path.join(self.local_storage_path, storage_key.replace("/", "_"))
                if os.path.exists(file_path):
                    os.remove(file_path)
                return True
            else:
                self.s3_client.delete_object(
                    Bucket=self.bucket,
                    Key=storage_key
                )
                return True
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete file: {str(e)}"
            )

    async def get_file(self, storage_key: str) -> tuple[bytes, str]:
        """Get file content from storage"""
        try:
            if self.use_local:
                file_path = os.path.join(self.local_storage_path, storage_key.replace("/", "_"))
                if not os.path.exists(file_path):
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="File not found in storage"
                    )
                with open(file_path, "rb") as f:
                    return f.read(), "application/octet-stream"
            else:
                response = self.s3_client.get_object(
                    Bucket=self.bucket,
                    Key=storage_key
                )
                content_type = response.get('ContentType', 'application/octet-stream')
                return response['Body'].read(), content_type
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchKey':
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="File not found in storage"
                )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve file: {str(e)}"
            )

    def get_public_url(self, storage_key: str) -> str:
        """Generate public URL for a file"""
        return f"/api/public/{storage_key}"


# Singleton instance
storage_service = StorageService()
