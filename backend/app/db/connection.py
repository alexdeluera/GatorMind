"""connection.py

MongoDB connection helpers.

This module now wraps the Motor async client using the
MongoDB settings defined in ``app.core.settings``. It is
intended for non-FastAPI contexts (scripts, utilities).
The FastAPI app itself uses ``app.db.mongo`` to manage
the client lifecycle via startup/shutdown events.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from app.core import MONGODB_URI, MONGODB_DB

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    """Return a singleton Motor client configured via settings."""
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(MONGODB_URI)
    return _client


def get_database():
    """Convenience accessor for the configured MongoDB database."""
    client = get_client()
    return client[MONGODB_DB]


def close_client() -> None:
    """Close the underlying MongoDB client, if it was created."""
    global _client
    if _client is not None:
        _client.close()
        _client = None

