"""
main.py

Entry point for the FastAPI backend application.

Responsibilities:
- Initialize the FastAPI app
- Register API routers
- Serve as the main startup file for the backend

Note:
- This file does NOT contain business logic.
- Route implementations live in app/api/.
- Database logic lives in app/db/.
"""

from fastapi import FastAPI
from app.api.routes import router as api_router

app = FastAPI(title="GatorMind API")

@app.get("/")
def root():
    return {"message": "Backend is running"}

app.include_router(api_router)
