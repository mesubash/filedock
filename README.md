# FileDock - Secure File Management System

A production-ready file management system with React frontend and FastAPI backend, featuring user authentication, role-based access control, and cloud storage integration.

## Project Structure

```
/src          → React + TypeScript frontend
/backend      → FastAPI + PostgreSQL backend
/docs         → Documentation
```

## Features

### Core Features
- 🔐 **JWT Authentication** - Secure login with token-based auth
- 👥 **User Management** - Admin panel for user administration
- 📁 **File Upload** - Drag & drop with multiple file support
- 🔒 **Public/Private Files** - Control file visibility
- 📂 **Folder Management** - Organize files in folders with breadcrumbs
- 🔗 **Shareable Links** - Friendly URLs for public files (e.g., `/api/public/my-document-abc123`)
- 📊 **File Browser** - Browse, search, and filter files
- 👁️ **File Preview** - View files inline in browser
- ⬇️ **Download** - Download files with original names

### Security
- 🛡️ **User Isolation** - Users only see their own files
- 👨‍💼 **Admin Role** - Admins have full access to all files and users
- 🔑 **Password Hashing** - Secure password storage
- 🚫 **Route Protection** - Protected routes for authenticated users only
- 🎭 **UI Authorization** - Admin sections hidden from regular users

### Storage
- ☁️ **Cloud Storage** - Garage S3-compatible storage integration
- 📦 **Organized Storage** - Files stored with unique keys and prefixes
- 🏷️ **Metadata** - Rich file metadata (type, tags, description, custom names)

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- React Router v6
- Zustand (state management)
- Shadcn UI components
- TailwindCSS
- React Dropzone
- Sonner (toast notifications)

### Backend
- FastAPI (Python web framework)
- SQLAlchemy (ORM)
- PostgreSQL (database)
- Pydantic (validation)
- JWT authentication
- Boto3 (S3/Garage storage)
- Uvicorn (ASGI server)

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.13+
- PostgreSQL 14+
- Garage or S3-compatible storage

### Frontend Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API URL

# Run development server
npm run dev
```

Visit: <http://localhost:5173>

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env.local
# Edit .env.local with your database and storage credentials

# Run migrations
python -m app.migrate

# Seed database (creates admin user)
python -m app.seed

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Visit API docs: <http://localhost:8000/docs>

### Default Credentials

- **Admin User:**
  - Email: `admin@example.com`
  - Password: `admin123`

- **Regular User:**
  - Email: `user@example.com`
  - Password: `user123`

## Environment Configuration

### Frontend (.env.local)

```env
VITE_API_URL=http://localhost:8000
```

### Backend (.env.local)

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/filedock

# JWT
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Cloud Storage
STORAGE_ENDPOINT=https://garage.rivetsoft.com
STORAGE_ACCESS_KEY=your-access-key
STORAGE_SECRET_KEY=your-secret-key
STORAGE_BUCKET=your-bucket-name
STORAGE_REGION=garage
STORAGE_PREFIX=filedock

# CORS
FRONTEND_URL=http://localhost:5173
```

## Key Features Explained

### User Roles

- **Admin Users** (`is_admin=True`):
  - Access to user management
  - Can see all files from all users
  - Can manage all folders
  - Full system access

- **Regular Users** (`is_admin=False`):
  - Can only see their own files
  - Can create folders in their own workspace
  - Cannot access admin features

### File Visibility

- **Private Files**:
  - Require authentication to access
  - Only owner (or admin) can view/download
  - Accessed via: `/api/files/view/{id}` or `/api/files/download/{id}`

- **Public Files**:
  - Accessible without authentication
  - Can have custom friendly URLs
  - Accessed via: `/api/public/{slug}` or `/api/public/view/{slug}`
  - Example: `/api/public/annual-report-a7b3`

### Folder Organization

- Create nested folder structures
- Breadcrumb navigation
- Move files between folders
- Folder tree view
- Root-level and nested uploads

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user info

### Files

- `POST /api/files/upload` - Upload file with metadata
- `GET /api/files` - List files (paginated, filtered)
- `GET /api/files/{id}` - Get file metadata
- `GET /api/files/view/{id}` - View file inline
- `GET /api/files/download/{id}` - Download file
- `PUT /api/files/{id}` - Update file metadata
- `PUT /api/files/{id}/move` - Move file to folder
- `DELETE /api/files/{id}` - Delete file

### Folders

- `POST /api/folders` - Create folder
- `GET /api/folders` - List all folders
- `GET /api/folders/tree` - Get folder tree
- `GET /api/folders/contents` - Get folder contents
- `GET /api/folders/{id}` - Get folder by ID
- `PUT /api/folders/{id}` - Update folder
- `DELETE /api/folders/{id}` - Delete folder

### Users (Admin Only)

- `GET /api/users/` - List all users
- `POST /api/users/` - Create user
- `GET /api/users/{id}` - Get user by ID
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Public Files

- `GET /api/public/{slug}` - Download public file by slug
- `GET /api/public/view/{slug}` - View public file by slug

## Production Deployment

### Frontend

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy 'dist' folder to your hosting (Vercel, Netlify, etc.)
```

### Backend

1. **Environment Setup**:
   - Use production database credentials
   - Set strong `SECRET_KEY`
   - Configure production storage endpoint
   - Set `FRONTEND_URL` to your frontend domain

2. **Database**:
   - Use PostgreSQL with connection pooling
   - Run migrations: `python -m app.migrate`
   - Seed initial data: `python -m app.seed`

3. **Server**:

   ```bash
   # Install production dependencies
   pip install gunicorn uvicorn[standard]

   # Run with Gunicorn
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   ```

4. **Security**:
   - Enable HTTPS
   - Configure proper CORS origins
   - Set up firewall rules
   - Use environment variables for secrets
   - Regular security updates

## Development Tips

### Backend Development

```bash
# Run with auto-reload
uvicorn app.main:app --reload

# Run migrations
python -m app.migrate

# Seed database
python -m app.seed

# Access interactive API docs
# Visit http://localhost:8000/docs
```

### Frontend Development

```bash
# Run dev server
npm run dev

# Type checking
npm run type-check

# Lint
npm run lint

# Format
npm run format
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized errors**:
   - User needs to logout and login again
   - Check token in localStorage under "auth-storage"

2. **Storage credentials not configured**:
   - Verify `.env.local` has correct `STORAGE_*` variables
   - Ensure file is in `backend/` directory

3. **Database connection errors**:
   - Check PostgreSQL is running
   - Verify `DATABASE_URL` in `.env.local`
   - Check database exists and credentials are correct

4. **File upload fails**:
   - Check storage credentials are valid
   - Verify bucket exists and is accessible
   - Check file size limits

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
