#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

echo "Syncing Python environment with pyproject.toml..."
uv sync

echo "Installing Playwright browser dependencies (Chromium)..."
playwright install chromium

echo "Backend setup complete."
