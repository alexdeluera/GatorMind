"""mongo.py

Async MongoDB connection helper using Motor.

Usage:
- On app startup, call `init_mongo(app)` to attach
  `mongo_client` and `db` to `app.state`.
- On app shutdown, call `close_mongo(app)`.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from app.core import MONGODB_URI, MONGODB_DB


async def init_mongo(app) -> None:
    """Initialize MongoDB client and attach to FastAPI app state."""
    client = AsyncIOMotorClient(MONGODB_URI)
    app.state.mongo_client = client
    app.state.db = client[MONGODB_DB]


async def close_mongo(app) -> None:
    """Close MongoDB client on application shutdown."""
    client = getattr(app.state, "mongo_client", None)
    if client is not None:
        client.close()
