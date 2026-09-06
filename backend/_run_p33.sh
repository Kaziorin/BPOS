#!/bin/bash
cd /home/wadi/BlueOcean/php/modernpos/backend

# Kill any existing server
pkill -f "uvicorn main:app" 2>/dev/null
sleep 2

# Start server
venv/bin/uvicorn main:app --host 0.0.0.0 --port 4000 &
SERVER_PID=$!
echo "Server started PID=$SERVER_PID"

# Wait for server to be ready
for i in $(seq 1 15); do
  if curl -s http://localhost:4000/health > /dev/null 2>&1; then
    echo "Server ready"
    break
  fi
  sleep 1
done

# Run the test (default: _p33_e2e.py, override with TEST_SCRIPT env var)
TEST_SCRIPT=${TEST_SCRIPT:-_p33_e2e.py}
echo "Running $TEST_SCRIPT"
venv/bin/python $TEST_SCRIPT
RESULT=$?

# Kill server
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

exit $RESULT
