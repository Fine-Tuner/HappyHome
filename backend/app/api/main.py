from fastapi import APIRouter

from app.api.routes import (
    announcement,
    category,
    comment,
    condition,
    login,
    question,
    user,
)

api_router = APIRouter()

api_router.include_router(login.router)
api_router.include_router(announcement.router)
api_router.include_router(category.router)
api_router.include_router(condition.router)
api_router.include_router(comment.router)
api_router.include_router(question.router)
api_router.include_router(user.router)
