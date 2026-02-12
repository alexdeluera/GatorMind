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
from app.db.mongo import init_mongo, close_mongo

app = FastAPI(title="GatorMind API")


@app.on_event("startup")
async def on_startup() -> None:
    await init_mongo(app)


@app.on_event("shutdown")
async def on_shutdown() -> None:
    await close_mongo(app)


@app.get("/")
def root():
    return {"message": "Backend is running"}


app.include_router(api_router)
