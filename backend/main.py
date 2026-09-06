"""BlueOceans POS API — Production Architecture Entry Point.

Starts the modular FastAPI application from app.main.
Run:
    python -m uvicorn main:app --port 4000 --reload
"""
from __future__ import annotations

import uvicorn
from app.main import app, create_app

__all__ = ["app", "create_app"]

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=4000, reload=True)
