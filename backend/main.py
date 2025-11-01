from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.database import engine, Base
from app.api.routes import auth, instagram, automation, webhooks
from app.core.config import settings

# Create database tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting Instagram DM Automation API...")
    yield
    # Shutdown
    print("Shutting down...")

app = FastAPI(
    title="Instagram DM Automation API",
    description="API for automating Instagram direct messages via Instagram Graph API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(instagram.router, prefix="/api/instagram", tags=["Instagram"])
app.include_router(automation.router, prefix="/api/automation", tags=["Automation"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["Webhooks"])

@app.get("/")
async def root():
    return {
        "message": "Instagram DM Automation API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True
    )
