#!/bin/bash

# Start RAG Backend Script
# This script starts the FastAPI RAG backend server

echo "🚀 Starting RAG Backend Server..."
echo ""

# Check if we're in the correct directory
if [ ! -d "llm/RAG-System-for-Car-Recommendation-Chatbot" ]; then
    echo "❌ Error: llm/RAG-System-for-Car-Recommendation-Chatbot directory not found"
    echo "   Please run this script from the project root"
    exit 1
fi

# Navigate to the LLM directory
cd llm/RAG-System-for-Car-Recommendation-Chatbot

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed"
    exit 1
fi

echo "✅ Python found: $(python3 --version)"

# Check if virtual environment exists, create if not
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📦 Installing dependencies..."
pip install -q -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found"
    echo "   Creating default .env file..."
    cat > .env << EOF
# Qdrant Configuration
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=

# Ollama Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# Embedding Model
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Retrieval Configuration
RETRIEVAL_K=5

# LLM Configuration
LLM_TEMPERATURE=0.7
LLM_TOP_P=0.9
EOF
    echo "   ✅ Created .env file with defaults"
fi

# Check if data has been ingested
if [ ! -d "backend/data/processed" ] || [ -z "$(ls -A backend/data/processed)" ]; then
    echo "⚠️  Warning: No processed data found"
    echo "   You may need to run data ingestion first"
    echo "   Run: python backend/rag/loader.py && python backend/rag/embed.py --recreate"
    echo ""
    read -p "   Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🌟 Starting FastAPI server on http://localhost:8000"
echo "   Press Ctrl+C to stop"
echo ""

# Start the server
python3 -m uvicorn backend.main:app --reload --port 8000 --host 0.0.0.0

