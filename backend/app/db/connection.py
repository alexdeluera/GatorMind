"""
connection.py

Provides a reusable MongoDB database connection.

Responsibilities:
- Maintain a single MongoClient instance (connection pooling)
- Expose helpers to get the client, the default database, and collections
"""

from pymongo import MongoClient
from pymongo.database import Database
from pymongo.collection import Collection
from app.core import MONGO_URI, MONGO_DB_NAME

# ---------------------------------------------------------------------------
# Singleton client – MongoClient already manages an internal connection pool,
# so creating one instance at module level and reusing it is the recommended
# pattern.
# ---------------------------------------------------------------------------
_client: MongoClient | None = None


def get_client() -> MongoClient:
    """Return (and lazily create) the shared MongoClient."""
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URI)
    return _client


def get_database(name: str | None = None) -> Database:
    """
    Return a pymongo Database object.

    Parameters
    ----------
    name : str, optional
        Database name.  Defaults to the MONGO_DB_NAME setting.
    """
    return get_client()[name or MONGO_DB_NAME]


def get_collection(collection_name: str, db_name: str | None = None) -> Collection:
    """
    Shortcut to grab a collection from the default (or named) database.
    """
    return get_database(db_name)[collection_name]


def close_connection() -> None:
    """Close the MongoClient. Call on app shutdown."""
    global _client
    if _client is not None:
        _client.close()
        _client = None
