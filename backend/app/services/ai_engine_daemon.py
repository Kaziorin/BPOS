"""AI Engine Background Process Manager.
Automatically starts and monitors the local offline Ollama service
when the SalePay backend starts.
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

_ollama_process: subprocess.Popen | None = None

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
MODELS_DIR = BACKEND_DIR / "ai_engine" / "models"


def is_ollama_running(url: str = "http://127.0.0.1:11434") -> bool:
    try:
        with urllib.request.urlopen(f"{url}/api/tags", timeout=1.5) as res:
            return res.status == 200
    except Exception:
        return False


def start_ai_engine() -> bool:
    """Start Ollama in the background if it is not already running."""
    global _ollama_process

    if is_ollama_running():
        return True

    ollama_bin = shutil.which("ollama")
    if not ollama_bin:
        # Check standard default Windows install locations
        local_app_data = os.environ.get("LOCALAPPDATA", "")
        candidate = Path(local_app_data) / "Programs" / "Ollama" / "ollama.exe"
        if candidate.exists():
            ollama_bin = str(candidate)

    if not ollama_bin:
        return False

    env = os.environ.copy()
    if MODELS_DIR.exists():
        env["OLLAMA_MODELS"] = str(MODELS_DIR)

    try:
        creation_flags = 0
        if sys.platform == "win32":
            creation_flags = subprocess.CREATE_NO_WINDOW | subprocess.DETACHED_PROCESS

        _ollama_process = subprocess.Popen(
            [ollama_bin, "serve"],
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=creation_flags,
        )

        # Wait briefly for startup
        for _ in range(10):
            time.sleep(0.5)
            if is_ollama_running():
                return True
        return False
    except Exception:
        return False


def stop_ai_engine():
    """Terminate the Ollama process if we started it."""
    global _ollama_process
    if _ollama_process:
        try:
            _ollama_process.terminate()
            _ollama_process = None
        except Exception:
            pass
