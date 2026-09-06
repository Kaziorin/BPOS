"""Database session and connection management."""
from __future__ import annotations

import sys
from pathlib import Path

# Add backend directory to sys.path for backward-compatible db reflection
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import db as _db

engine = _db.engine
sync_engine = _db.sync_engine
metadata = _db.metadata
T = _db.T
AsyncSessionLocal = _db.AsyncSessionLocal
get_db = _db.get_db
txn = _db.txn
