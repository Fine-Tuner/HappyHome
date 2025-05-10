from fastapi import APIRouter

from app.api.routes import announcement, category, condition

api_router = APIRouter()

api_router.include_router(announcement.router)
api_router.include_router(category.router)
api_router.include_router(condition.router)
