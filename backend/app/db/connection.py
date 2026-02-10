"""
connection.py

Provides a reusable SQLite database connection helper.

Responsibilities:
- Create and return a SQLite connection
- Configure row access for dictionary-style usage

"""

import sqlite3
from app.core import DB_PATH


def get_connection() -> sqlite3.Connection:
    """
    Create and return a SQLite database connection.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn
