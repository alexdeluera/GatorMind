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

import os
from pathlib import Path

# Base directory for the backend
BASE_DIR = Path(__file__).resolve().parents[2]

# MongoDB
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "gatormind")

# Supporting directories
DOCS_DIR = BASE_DIR / "docs"