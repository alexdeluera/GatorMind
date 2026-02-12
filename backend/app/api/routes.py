"""routes.py

Top-level API routes for the FastAPI backend.

Includes a health check and a minimal MongoDB-backed
example for a generic `items` collection.
"""

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel


router = APIRouter()


@router.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "ok"}


class Item(BaseModel):
    name: str
    value: dict = {}


@router.post("/items")
async def create_item(request: Request, item: Item):
    """Create a new item in the MongoDB `items` collection."""
    db = request.app.state.db
    result = await db.items.insert_one(item.model_dump())
    return {"_id": str(result.inserted_id)}


@router.get("/items/{item_id}")
async def get_item(request: Request, item_id: str):
    """Fetch a single item by its MongoDB ObjectId string."""
    db = request.app.state.db
    try:
        oid = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid item id")

    doc = await db.items.find_one({"_id": oid})
    if doc is None:
        raise HTTPException(status_code=404, detail="Item not found")

    doc["_id"] = str(doc["_id"])
    return doc

