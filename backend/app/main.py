from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base
import app.models  # Registers all SQLAlchemy tables

from api.otp import router as otp_router
from api.citizen import router as citizen_router
from api.mp import router as mp_router

# Create SQLite database tables on startup (no dummy seed data)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI for Constituency Development Planning - Visakhapatnam",
    version="1.0.0"
)

# Enable CORS so your Vercel frontend can securely call your Render backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded citizen photos and voice recordings
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Register API routers
app.include_router(otp_router)
app.include_router(citizen_router)
app.include_router(mp_router)


@app.get("/")
def root():
    return {
        "project": "Janapriya - People's Priorities Platform",
        "status": "Backend Running Successfully (Render)",
        "docs_url": "/docs"
    }