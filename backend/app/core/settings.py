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
from dotenv import load_dotenv



# Base directory for the backend
BASE_DIR = Path(__file__).resolve().parents[2]

# Load environment variables from .env file
load_dotenv(BASE_DIR / ".env")

# MongoDB
MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "gatormind")

# Safety check: if MONGO_URI is missing, the app should warn you immediately
if not MONGO_URI:
    raise ValueError("MONGO_URI not found! Ensure your .env file is configured correctly.")

# Supporting directories
DOCS_DIR = BASE_DIR / "docs"