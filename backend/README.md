# FastAPI Backend Setup

This is the backend structure for the File Manager application using FastAPI and PostgreSQL.

## Tech Stack

- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **Alembic** - Database migrations
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Boto3/MinIO** - S3-compatible storage (Garage)

## Directory Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py          # Authentication endpoints
│   │   └── files.py         # File management endpoints
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py        # Configuration settings
│   │   ├── security.py      # JWT and password hashing
│   │   └── database.py      # Database connection
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py          # User model
│   │   └── file.py          # File model
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py          # Auth Pydantic schemas
│   │   └── file.py          # File Pydantic schemas
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py  # Authentication logic
│   │   ├── file_service.py  # File management logic
│   │   └── storage_service.py # S3/Garage integration
│   └── main.py              # FastAPI app entry point
├── alembic/                 # Database migrations
├── requirements.txt         # Python dependencies
└── .env.example            # Environment variables template
```

## Setup Instructions

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your settings:
- Database credentials
- JWT secret key
- Garage/S3 configuration

### 4. Initialize Database

```bash
# Create database tables
alembic upgrade head

# Create admin user (optional)
python scripts/create_admin.py
```

### 5. Run Development Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API will be available at: http://localhost:8000
API docs: http://localhost:8000/docs

## Environment Variables

Required variables in `.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost/filemanager

# JWT
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Garage/S3 Storage
GARAGE_ENDPOINT=http://localhost:3900
GARAGE_ACCESS_KEY=your-access-key
GARAGE_SECRET_KEY=your-secret-key
GARAGE_BUCKET=files
GARAGE_REGION=garage

# CORS
FRONTEND_URL=http://localhost:8080
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/register` - Register new user (optional)

### Files (Requires Authentication)
- `POST /api/files/upload` - Upload file (streaming)
- `GET /api/files` - List all files
- `GET /api/files/{file_id}` - Get file metadata
- `DELETE /api/files/{file_id}` - Delete file
- `GET /api/public/{file_key}` - Serve public file (no auth)
- `GET /api/private/{file_key}` - Serve private file (requires auth)

## Database Models

### User
```python
- id: UUID (PK)
- email: String (unique)
- password_hash: String
- created_at: DateTime
```

### File
```python
- id: UUID (PK)
- original_name: String
- storage_key: String (unique)
- is_public: Boolean
- size: Integer
- created_at: DateTime
- uploaded_by: UUID (FK -> User)
```

## Key Features to Implement

1. **Streaming File Upload/Download** - Avoid loading entire file in RAM
2. **JWT Authentication** - Secure private endpoints
3. **File Validation** - Type and size checks
4. **S3 Integration** - Use boto3 or minio-py client
5. **Database Transactions** - Proper error handling
6. **CORS Configuration** - Allow frontend requests
7. **Logging** - Structured logging for debugging

## Production Deployment

1. Use proper ASGI server (Gunicorn + Uvicorn)
2. Configure PostgreSQL with connection pooling
3. Set up proper logging
4. Use environment-specific configs
5. Enable HTTPS
6. Configure rate limiting
7. Set up monitoring

## Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=app tests/
```

## Notes

- Always use async/await for database and storage operations
- Stream large files to avoid memory issues
- Validate file types before storage
- Use transactions for database operations
- Log all errors with context
- Return proper HTTP status codes
- Document all endpoints with OpenAPI
