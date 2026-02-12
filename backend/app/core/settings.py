"""
settings.py

Central configuration file for the FastAPI backend.

Responsibilities:
- Define filesystem paths used across the backend
- Provide a single source of truth for configuration values

Note:
- Paths defined here should be imported wherever needed.
- Avoid hardcoding paths elsewhere in the codebase.
"""

from pathlib import Path
import os

# Base directory for the backend
BASE_DIR = Path(__file__).resolve().parents[2]

# SQLite (legacy, no longer used for primary DB)
DB_PATH = BASE_DIR / "db" / "gatormind.db"

# MongoDB settings (primary DB)
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "gator_db")

# Supporting directories
SQL_DIR = BASE_DIR / "sql"
DOCS_DIR = BASE_DIR / "docs"