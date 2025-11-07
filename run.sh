#!/bin/bash

# SQL Learning Game - Startup Script

echo "Starting SQL Learning Game..."
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Creating..."
    python3 -m venv venv
    echo "Installing dependencies..."
    ./venv/bin/pip install -r requirements.txt
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "Please copy .env.example to .env and add your Anthropic API key"
    echo ""
    read -p "Press Enter to continue anyway (the app will start but AI features won't work)..."
fi

# Activate virtual environment and start Flask
echo "Starting Flask server..."
echo "Access the app at: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd backend
../venv/bin/python3 app.py
