from fastapi import APIRouter

from app.api.routers import page_router, pikmiverse_router, team_router

api_router = APIRouter()
api_router.include_router(team_router.router)
api_router.include_router(pikmiverse_router.router)
api_router.include_router(page_router.router)
