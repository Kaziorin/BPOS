# Blue Oceans POS - Local Offline AI Engine (Air-Gapped)

This folder contains the self-contained offline AI package for Blue Oceans POS.

## Security & Data Privacy Guarantee
- **100% Localhost Only (`127.0.0.1:11434`)**: Bound strictly to local loopback. Outside networks, public IPs, and internet crawlers CANNOT connect to this engine.
- **Zero Cloud Leakage**: No data is ever sent to OpenAI, Google, Ollama servers, or any external service.
- **Air-Gapped Ready**: Operates seamlessly without internet connection.

## Model Weights Included:
- `qwen2.5:0.5b` (~397 MB): Ultra-fast CPU inference for real-time POS queries.
- `qwen2.5:1.5b` (~986 MB): Advanced reasoning model for deep business analytics.

## Running in Production (Linux VPS):
1. Ensure Ollama binary is installed: `curl -fsSL https://ollama.com/install.sh | sh`
2. Run the starter script: `bash backend/ai_engine/start_engine.sh`
3. Backend `.env` configuration:
   ```env
   OLLAMA_BASE_URL="http://127.0.0.1:11434"
   OLLAMA_MODEL="qwen2.5:0.5b"
   ```
