"""
routes.py

Defines top-level API routes for the FastAPI backend.

Responsibilities:
- Declare API endpoints and HTTP methods
- Group routes using APIRouter
- Keep routing separate from business logic

"""

from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
def health():
    """
    Health check endpoint.

    Used to verify that the backend server is running.
    """
    return {"status": "ok"}
