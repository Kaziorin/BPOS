#!/bin/bash
# Blue Oceans POS - Offline AI Engine Starter for Linux VPS
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
export OLLAMA_MODELS="$DIR/models"
export OLLAMA_HOST="127.0.0.1:11434"
echo "Starting Blue Oceans POS Local Offline AI Engine on 127.0.0.1:11434..."
echo "Model storage path: $OLLAMA_MODELS"
ollama serve
