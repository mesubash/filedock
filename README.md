# File Manager - Full Stack Application

A production-ready file management system with React frontend and FastAPI backend.

## Project Structure

```
/frontend     → React + Vite (this directory)
/backend      → FastAPI + PostgreSQL
```

## Features

- 🔐 JWT Authentication
- 📁 File Upload with drag & drop
- 🔒 Public/Private file visibility
- 📊 File management dashboard
- 🔗 Shareable links for public files
- 📱 Fully responsive design
- 🎨 Modern UI with Shadcn components

## Frontend (React + Vite)

### Tech Stack
- React 18 + TypeScript
- Vite
- React Router
- Zustand (state management)
- Shadcn UI components
- TailwindCSS
- React Dropzone

### Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit: http://localhost:8080

### Default Credentials
- Email: `admin@example.com`
- Password: `admin`

### Pages
- `/` - Landing page
- `/login` - Authentication
- `/dashboard` - Overview
- `/dashboard/upload` - Upload files
- `/dashboard/files` - List all files
- `/dashboard/files/:id` - File details

## Backend (FastAPI)

See [backend/README.md](backend/README.md) for detailed setup instructions.

### Quick Start

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run server
uvicorn app.main:app --reload
```

Visit: http://localhost:8000/docs

## Development Workflow

1. **Frontend Development**
   - Frontend includes mock API for standalone development
   - All UI features work without backend

2. **Backend Development**
   - Implement FastAPI endpoints following the structure in `/backend`
   - Update frontend API calls in `src/lib/api/mock-api.ts` to use real endpoints

3. **Integration**
   - Replace mock API calls with actual HTTP requests
   - Configure CORS in backend for frontend origin
   - Test authentication flow end-to-end

## Environment Variables

### Frontend
Create `.env.local`:
```env
VITE_API_URL=http://localhost:8000
```

### Backend
Copy `backend/.env.example` to `backend/.env` and configure all values.

## Production Deployment

### Frontend
```bash
npm run build
# Deploy the 'dist' folder to your hosting
```

### Backend
- Use Gunicorn + Uvicorn workers
- Configure PostgreSQL with connection pooling
- Set up Garage/S3 storage
- Enable HTTPS
- Configure proper CORS origins

## API Integration

Replace mock API in `src/lib/api/mock-api.ts` with real HTTP calls:

```typescript
// Example real API implementation
export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return response.json();
    }
  },
  // ... other endpoints
};
```

## License

MIT
