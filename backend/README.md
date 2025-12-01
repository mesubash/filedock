# FileDock Backend - FastAPI File Management System

Backend API for FileDock file management system with user authentication, role-based access control, and cloud storage integration.

## Tech Stack

- **FastAPI** - Modern Python web framework with automatic API docs
- **SQLAlchemy** - ORM for database operations
- **PostgreSQL** - Relational database
- **Pydantic** - Data validation and settings
- **JWT** - Token-based authentication
- **Boto3** - S3-compatible storage (Garage)
- **Uvicorn** - ASGI server
- **Python 3.13+** - Latest Python features

## Directory Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── files.py         # File management endpoints
│   │   ├── folders.py       # Folder management endpoints
│   │   ├── users.py         # User management (admin only)
│   │   ├── public.py        # Public file access
│   │   └── deps.py          # Dependencies (auth, db)
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py        # Configuration settings
│   │   ├── security.py      # JWT and password hashing
│   │   └── database.py      # Database connection
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py          # User model
│   │   └── file.py          # File and Folder models
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py          # Auth Pydantic schemas
│   │   └── file.py          # File/Folder Pydantic schemas
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py     # Authentication logic
│   │   ├── file_service.py     # File management logic
│   │   ├── folder_service.py   # Folder management logic
│   │   └── storage_service.py  # Cloud storage integration
│   ├── main.py              # FastAPI app entry point
│   ├── migrate.py           # Database migrations
│   └── seed.py              # Seed initial data
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variables template
└── README.md               # This file
```

## Features

- ✅ JWT authentication with password hashing
- ✅ User management with admin role
- ✅ User isolation (users see only their files)
- ✅ File upload/download with streaming
- ✅ Public and private file visibility
- ✅ Folder organization with breadcrumbs
- ✅ File preview and download
- ✅ Custom friendly URLs for public files
- ✅ Cloud storage (Garage S3-compatible)
- ✅ Pagination and filtering
- ✅ Search functionality
- ✅ File metadata (tags, description, type)
- ✅ Auto-generated API documentation

## Setup Instructions

### 1. Prerequisites

- Python 3.13 or higher
- PostgreSQL 14+
- Garage or S3-compatible storage
- Virtual environment tool (venv)

### 2. Create Virtual Environment

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your settings:

```env
# Database Configuration
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/filedock

# JWT Configuration
SECRET_KEY=your-secret-key-here-use-openssl-rand-hex-32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Cloud Storage Configuration
STORAGE_ENDPOINT=https://garage.rivetsoft.com
STORAGE_ACCESS_KEY=your-access-key
STORAGE_SECRET_KEY=your-secret-key
STORAGE_BUCKET=your-bucket-name
STORAGE_REGION=garage
STORAGE_PREFIX=filedock

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

### 5. Initialize Database

```bash
# Run migrations to create tables
python -m app.migrate

# Seed database with initial users
python -m app.seed
```

This creates two users:

- **Admin**: `admin@example.com` / `admin123`
- **User**: `user@example.com` / `user123`

### 6. Run Development Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Access Points:**

- API: <http://localhost:8000>
- Interactive API docs: <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>
- Health check: <http://localhost:8000/health>

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login and receive JWT token
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user information

### Files (Authentication Required)

- `POST /api/files/upload` - Upload file with metadata
- `GET /api/files` - List files (paginated, with filters)
- `GET /api/files/{id}` - Get file metadata by ID
- `GET /api/files/view/{id}` - View file inline in browser
- `GET /api/files/download/{id}` - Download file
- `PUT /api/files/{id}` - Update file metadata and visibility
- `PUT /api/files/{id}/move` - Move file to different folder
- `DELETE /api/files/{id}` - Delete file

### Folders (Authentication Required)

- `POST /api/folders` - Create new folder
- `GET /api/folders` - List all folders
- `GET /api/folders/tree` - Get complete folder tree
- `GET /api/folders/contents` - Get folder contents (files + subfolders)
- `GET /api/folders/{id}` - Get folder by ID
- `GET /api/folders/{id}/breadcrumbs` - Get breadcrumb trail
- `PUT /api/folders/{id}` - Update folder (rename, move)
- `DELETE /api/folders/{id}` - Delete folder

### Users (Admin Only)

- `GET /api/users/` - List all users (paginated)
- `POST /api/users/` - Create new user
- `GET /api/users/{id}` - Get user by ID
- `PUT /api/users/{id}` - Update user (email, password, role, status)
- `DELETE /api/users/{id}` - Delete user

### Public Files (No Authentication)

- `GET /api/public/{slug}` - Download public file by slug
- `GET /api/public/view/{slug}` - View public file inline

## Database Models

### User

```python
class User(Base):
    id: int (PK)
    email: str (unique, indexed)
    password_hash: str
    is_admin: bool (default=False)
    is_active: bool (default=True)
    created_at: datetime
```

### File

```python
class File(Base):
    id: UUID (PK)
    original_name: str
    storage_key: str (unique)
    slug: str (unique, for public URLs)
    is_public: bool
    content_type: str
    file_size: int (bytes)
    file_type: str (document, image, video, etc.)
    description: str (optional)
    tags: list[str] (optional)
    custom_name: str (optional, for friendly URLs)
    folder_id: UUID (FK -> Folder, nullable)
    uploaded_by: int (FK -> User)
    created_at: datetime
    updated_at: datetime
```

### Folder

```python
class Folder(Base):
    id: UUID (PK)
    name: str
    parent_id: UUID (FK -> Folder, nullable)
    created_by: int (FK -> User)
    created_at: datetime
    updated_at: datetime
```

## Key Implementation Details

### User Isolation

- Non-admin users can only see/access their own files and folders
- Implemented at service layer with `user_id` and `is_admin` checks
- SQL queries filtered by `uploaded_by` or `created_by`

### File Slugs

Generated using patterns:

- **readable**: `adjective-noun-xxxx` (e.g., `swift-star-a7b3`)
- **short**: `xxxx-xxxx` (e.g., `a7b3-c9d1`)
- **named**: `custom-name-xxxx` (e.g., `my-document-a7b3`)

### Storage Organization

Files stored with structure:

```
{prefix}/files/{uuid}-{filename}
Example: filedock/files/abc123-document.pdf
```

### Authentication Flow

1. User logs in with email/password
2. Backend validates credentials
3. Returns JWT token + user info
4. Frontend stores token in localStorage
5. Token sent in `Authorization: Bearer {token}` header
6. Backend validates token on protected routes

### Error Handling

- 400: Bad request (validation errors)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not found
- 422: Unprocessable entity (Pydantic validation)
- 500: Internal server error

## Development

### Run with Auto-Reload

```bash
uvicorn app.main:app --reload
```

### Access API Documentation

Visit <http://localhost:8000/docs> for interactive Swagger UI

### Run Migrations

```bash
python -m app.migrate
```

### Seed Database

```bash
python -m app.seed
```

### Check Database

```bash
# Connect to PostgreSQL
psql -U user -d filedock

# List tables
\dt

# Query users
SELECT id, email, is_admin, is_active FROM users;

# Query files
SELECT id, original_name, is_public, uploaded_by FROM files LIMIT 10;
```

## Production Deployment

### 1. Server Setup

Use Gunicorn with Uvicorn workers:

```bash
pip install gunicorn uvicorn[standard]

gunicorn app.main:app \
  -w 4 \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -
```

### 2. Environment Configuration

- Use `.env.local` for production settings
- Set strong `SECRET_KEY` (32+ characters)
- Use production database with connection pooling
- Configure CORS for your frontend domain
- Set `FRONTEND_URL` to production URL

### 3. Security Checklist

- ✅ HTTPS enabled
- ✅ Strong JWT secret key
- ✅ Password hashing (bcrypt)
- ✅ CORS properly configured
- ✅ Database credentials secured
- ✅ Storage credentials secured
- ✅ Rate limiting (optional, use nginx)
- ✅ Firewall rules
- ✅ Regular security updates

### 4. Database

- Use PostgreSQL with SSL
- Enable connection pooling
- Regular backups
- Index optimization

### 5. Storage

- Verify bucket exists and is accessible
- Set proper bucket policies
- Enable CORS if needed
- Monitor storage usage

### 6. Monitoring

- Set up logging (structured JSON logs)
- Monitor API response times
- Track error rates
- Monitor database connections
- Set up alerts

## Troubleshooting

### Storage credentials error

```
ValueError: Storage credentials not configured
```

**Solution**: Check that `.env.local` has:

- `STORAGE_ACCESS_KEY`
- `STORAGE_SECRET_KEY`
- `STORAGE_ENDPOINT`
- `STORAGE_BUCKET`

### Database connection error

```
sqlalchemy.exc.OperationalError: could not connect to server
```

**Solution**:

- Verify PostgreSQL is running
- Check `DATABASE_URL` format
- Ensure database exists: `createdb filedock`

### Import errors

```
ModuleNotFoundError: No module named 'fastapi'
```

**Solution**: Activate virtual environment and install dependencies:

```bash
source .venv/bin/activate
pip install -r requirements.txt
```

### 401 Unauthorized

**Solution**:

- Check token is being sent in Authorization header
- Verify token hasn't expired
- User may need to logout and login again

## Notes

- All file operations use streaming to avoid memory issues
- Database operations use SQLAlchemy ORM
- File validation happens before storage
- Proper HTTP status codes returned
- All endpoints documented with OpenAPI
- Error messages don't expose internal details (security)
- Admin operations have role checks
- User isolation enforced at service layer

## License

MIT
