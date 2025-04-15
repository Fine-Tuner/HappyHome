#!/bin/bash

# Navigate to the backend directory relative to the script location
cd "$(dirname "$0")/.."

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    echo "Activating virtual environment..."
    source .venv/bin/activate
else
    echo "Warning: .venv directory not found. Assuming dependencies are installed globally or managed otherwise."
fi

# Start Celery Worker in the background
echo "Starting Celery worker..."
celery -A app.core.celery_app.celery_app worker --loglevel=info &
WORKER_PID=$!

# Start Celery Beat in the background
echo "Starting Celery beat..."
celery -A app.core.celery_app.celery_app beat --loglevel=info &
BEAT_PID=$!

# Give the worker and beat a second to start up
sleep 1

# Start Flower in the foreground
echo "Starting Flower monitor on http://127.0.0.1:5555 ..."
celery -A app.core.celery_app.celery_app flower --address=127.0.0.1 --port=5555 --persistent=True --db=flower

# Optional: Wait for the worker process when Flower exits (Ctrl+C)
# This might be useful depending on desired shutdown behavior
# wait $WORKER_PID
