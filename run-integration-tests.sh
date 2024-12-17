#!/bin/bash

set -e

VENV_PATH="./server/.venv/bin/activate"

if [ ! -f "$VENV_PATH" ]; then
  echo "Virtual environment not found at $VENV_PATH"
  exit 1
fi

echo "Activating Python virtual environment..."
source "$VENV_PATH"

# Start the FastAPI server in the background
echo "Starting FastAPI server..."
fastapi dev ./server/main.py > /dev/null 2>&1 &
SERVER_PID=$!
echo "FastAPI server started with PID $SERVER_PID"

WAIT_TIME=5
echo "Waiting for $WAIT_TIME seconds to ensure the server is ready..."
sleep $WAIT_TIME

# Run the integration tests
echo "Running integration tests..."
cd ./client
npm run test:long-polling
npm run test:short-polling
npm run test:failing-job
npm run test:rate-limiter
npm run test:server-error

echo "Stopping FastAPI server..."
kill $SERVER_PID
echo "FastAPI server stopped."

echo "Integration tests completed successfully."