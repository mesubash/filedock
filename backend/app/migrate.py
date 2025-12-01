"""
Simple migration script to add new columns to existing tables.
Run this if you have an existing database and need to add the new metadata columns.

Usage: python -m app.migrate
"""
from sqlalchemy import text
from app.core.database import engine


def run_migrations():
    """Add new columns to files table if they don't exist"""
    
    migrations = [
        # Add is_admin column to users
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'is_admin'
            ) THEN
                ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;
            END IF;
        END $$;
        """,
        # Add is_active column to users
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'is_active'
            ) THEN
                ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
            END IF;
        END $$;
        """,
        # Create folders table
        """
        CREATE TABLE IF NOT EXISTS folders (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR NOT NULL,
            parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
            created_by INTEGER NOT NULL REFERENCES users(id),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        """,
        # Create index on parent_id for faster queries
        """
        CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
        """,
        # Add slug column
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'files' AND column_name = 'slug'
            ) THEN
                ALTER TABLE files ADD COLUMN slug VARCHAR UNIQUE;
            END IF;
        END $$;
        """,
        # Add description column
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'files' AND column_name = 'description'
            ) THEN
                ALTER TABLE files ADD COLUMN description TEXT;
            END IF;
        END $$;
        """,
        # Add file_type column
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'files' AND column_name = 'file_type'
            ) THEN
                ALTER TABLE files ADD COLUMN file_type VARCHAR;
            END IF;
        END $$;
        """,
        # Add tags column
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'files' AND column_name = 'tags'
            ) THEN
                ALTER TABLE files ADD COLUMN tags VARCHAR;
            END IF;
        END $$;
        """,
        # Add folder_id column to files
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'files' AND column_name = 'folder_id'
            ) THEN
                ALTER TABLE files ADD COLUMN folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;
            END IF;
        END $$;
        """,
        # Create index on folder_id for faster queries
        """
        CREATE INDEX IF NOT EXISTS idx_files_folder_id ON files(folder_id);
        """,
        # Add updated_at column to files
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'files' AND column_name = 'updated_at'
            ) THEN
                ALTER TABLE files ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
            END IF;
        END $$;
        """,
    ]
    
    with engine.connect() as conn:
        for migration in migrations:
            conn.execute(text(migration))
            conn.commit()
        print("✅ Migrations completed successfully")


if __name__ == "__main__":
    run_migrations()
