from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, files, public, folders
from app.core.database import Base, engine

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="File Manager API",
    description="Secure file management with public/private storage",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "File Manager API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

# Register routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(files.router, prefix="/api/files", tags=["Files"])
app.include_router(folders.router, prefix="/api/folders", tags=["Folders"])
app.include_router(public.router, prefix="/api/public", tags=["Public Files"])
