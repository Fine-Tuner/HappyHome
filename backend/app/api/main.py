from fastapi import APIRouter

from app.api.routes import announcement

api_router = APIRouter()

api_router.include_router(announcement.router)
