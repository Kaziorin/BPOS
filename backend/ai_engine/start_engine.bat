@echo off
echo Starting Blue Oceans POS Local Offline AI Engine...
set OLLAMA_MODELS=%~dp0models
set OLLAMA_HOST=127.0.0.1:11434
echo Using model storage: %OLLAMA_MODELS%
ollama serve
