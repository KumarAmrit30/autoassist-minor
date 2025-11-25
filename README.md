# AutoAssist - AI-Powered Car Recommendation Platform

This is a [Next.js](https://nextjs.org) project with integrated cloud-based RAG (Retrieval-Augmented Generation) for intelligent car recommendations.

## 🌟 Features

- **🤖 Intelligent AI Search**: LLM-powered query understanding with automatic filter extraction
- **⚡ Fast Responses**: Powered by Groq's ultra-fast inference (1-2 second responses)
- **🔍 Smart Filtering**: Automatically understands constraints like "under 15 lakhs", "fuel efficient"
- **☁️ Cloud-Native**: Fully cloud-based (MongoDB Atlas, Qdrant Cloud, Groq API)
- **🎯 Context-Aware**: RAG system with 200+ cars and semantic search
- **💎 Beautiful UI**: Modern, responsive design with smooth animations
- **📊 Real-time Results**: Fast, accurate recommendations with metadata filtering

## 🚀 Quick Start

### ⚡ Super Quick (For Those Who Already Have Setup)

If you already have MongoDB, Qdrant, and Groq configured:

```bash
# Terminal 1: Start backend
./start-rag-backend.sh

# Terminal 2: Start frontend
npm run dev
```

Visit **http://localhost:3000** 🎉

---

### 📋 Full Setup (First Time - 5 Minutes)

#### Prerequisites

1. **MongoDB Atlas** (Free tier) - [Sign up here](https://www.mongodb.com/cloud/atlas/register)
2. **Qdrant Cloud** (Free tier) - [Sign up here](https://cloud.qdrant.io/)
3. **Groq API Key** (Free) - [Get API key here](https://console.groq.com/keys)

#### Setup Steps

**1. Clone and Install Dependencies**

```bash
# Clone the repository
git clone <your-repo-url>
cd autoassist-minor

# Install Node.js dependencies
npm install

# Setup Python environment for RAG backend
cd llm
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

**2. Configure Environment Variables**

Create `.env.local` in project root:

```env
# MongoDB (Required)
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/
MONGODB_DATABASE=autoassist
MONGODB_COLLECTION=cars_new

# Next.js
RAG_API_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Create `.env` in `llm/`:

```env
# MongoDB
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/
MONGODB_DATABASE=autoassist
MONGODB_COLLECTION=cars_new

# Qdrant Cloud (Required)
QDRANT_URL=https://your-cluster.cloud.qdrant.io:6333
QDRANT_API_KEY=your-qdrant-api-key
QDRANT_COLLECTION_NAME=cars_rag

# LLM - Groq (Recommended - Fastest)
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=llama-3.1-70b-versatile

# Embedding Model
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
EMBEDDING_DIMENSION=384

# Retrieval Settings
RETRIEVAL_K=5
USE_MONGODB=true
```

**3. Load Data and Create Embeddings**

```bash
cd llm
source venv/bin/activate

# Check environment setup
python check_env.py

# Load cars from MongoDB and create embeddings
python -m backend.rag.embed --mongodb --recreate

# Verify embeddings
python -c "
from qdrant_client import QdrantClient
import os
from dotenv import load_dotenv
load_dotenv()
client = QdrantClient(url=os.getenv('QDRANT_URL'), api_key=os.getenv('QDRANT_API_KEY'))
print(f'✅ Total cars embedded: {client.count(\"cars_rag\").count}')
"

cd ..
```

**4. Start the Application**

Open **3 terminals**:

**Terminal 1 - FastAPI Backend:**

```bash
# Option 1: Using the convenience script
./start-rag-backend.sh

# Option 2: Manual start
cd llm
source venv/bin/activate
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 - Next.js Frontend:**

```bash
npm run dev
```

**Terminal 3 - Test the RAG System:**

```bash
# Test health
curl http://localhost:8000/health

# Test RAG query
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "fuel efficient sedan under 15 lakhs"}'
```

**5. Visit** http://localhost:3000 and try:

- "fuel efficient sedan under 15 lakhs"
- "SUV for family with good safety features"
- "electric car with good range"
- "luxury sedan above 50 lakhs"

## 🎯 How It Works

### Intelligent Query Understanding

The RAG system uses **2-stage processing**:

1. **Filter Extraction** (LLM-powered):

   - "under 15 lakhs" → `price_max: 15.0`
   - "fuel efficient" → `mileage_min: 18.0`
   - "sedan" → `body_type: Sedan`
   - "family car" → `seating_capacity: 7`

2. **Semantic Search** (Vector similarity):

   - Query embedding → Find similar cars
   - Apply extracted filters
   - Rank by relevance

3. **Response Generation** (Groq LLM):
   - Context-aware recommendations
   - Specific model names, prices, features
   - Comparison of trade-offs

### Architecture

```
User Query
    ↓
[LLM Filter Extraction] → {price_max: 15, body_type: "Sedan", mileage_min: 18}
    ↓
[Semantic Search] → Find similar cars in Qdrant (200+ cars with metadata)
    ↓
[Metadata Filtering] → Apply extracted filters
    ↓
[Groq LLM] → Generate natural language response
    ↓
User sees: Recommended cars with details
```

## 🛠️ Technology Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Smooth animations
- **Lucide React** - Beautiful icons

### AI/RAG System (Cloud-Native)

- **FastAPI** - Python backend (async)
- **LangChain** - RAG orchestration
- **Qdrant Cloud** - Vector database (free tier)
- **Groq API** - Ultra-fast LLM inference (⚡ 1-2s responses)
- **SentenceTransformers** - Text embeddings (all-MiniLM-L6-v2)
- **MongoDB Atlas** - Car data storage

### Key Features

- ✅ **Intelligent Query Parsing** - LLM extracts filters from natural language
- ✅ **Metadata Filtering** - 10+ filter types (price, mileage, body type, etc.)
- ✅ **Semantic Search** - 384-dimensional embeddings
- ✅ **Real-time Inference** - Groq provides sub-2-second responses
- ✅ **Cloud-Ready** - No local infrastructure needed

## 📝 Available Scripts

```bash
# Development
npm run dev              # Start Next.js dev server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run linter

# Testing
npm test                # Run tests

# Deployment
npm run deploy:dev      # Deploy to development
npm run deploy:prod     # Deploy to production
```

## 🏗️ Project Structure

```
autoassist-minor/
├── src/
│   ├── app/                                    # Next.js App Router
│   │   ├── (marketing)/                       # Marketing pages
│   │   │   ├── home/page.tsx
│   │   │   ├── explore/page.tsx
│   │   │   ├── features/page.tsx
│   │   │   ├── about/page.tsx
│   │   │   └── contact/page.tsx
│   │   └── api/
│   │       ├── ai/
│   │       │   ├── rag-chat/route.ts          # RAG proxy endpoint
│   │       │   ├── chat/route.ts              # Gemini chat
│   │       │   └── search/route.ts            # AI search
│   │       └── cars/route.ts                  # Car API
│   ├── components/
│   │   ├── features/
│   │   │   ├── ai-chat-interface.tsx          # AI Chat UI
│   │   │   ├── hero-section.tsx
│   │   │   └── rag-recommendation-panel.tsx
│   │   ├── layout/                             # Header, Footer
│   │   └── ui/                                 # Reusable UI components
│   ├── services/
│   │   ├── ai/
│   │   │   ├── rag-client.ts                   # RAG API client
│   │   │   └── client.ts                       # Gemini client
│   │   └── car-data/                           # Car filtering & scoring
│   ├── contexts/                               # React contexts
│   └── types/
│       ├── car.ts
│       └── user.ts
│
├── llm/                                        # RAG Backend
│   ├── backend/
│   │   ├── main.py                             # FastAPI app
│   │   ├── rag/
│   │   │   ├── chain.py                        # RAG chain orchestration
│   │   │   ├── retriever.py                    # Qdrant retriever
│   │   │   ├── model.py                        # LLM loader (Groq)
│   │   │   ├── embed.py                        # Embedding pipeline
│   │   │   ├── mongodb_loader.py               # MongoDB data loader
│   │   │   └── query_parser.py                 # LLM query parser
│   │   ├── prompts/
│   │   │   └── base_prompt.txt                 # System prompt
│   │   ├── data/processed/                     # Processed car data
│   │   └── tests/                              # Backend tests
│   ├── venv/                                   # Python virtual environment
│   ├── requirements.txt                        # Python dependencies
│   ├── .env                                    # Backend environment config
│   ├── check_env.py                            # Environment checker
│   └── test_rag_system.py                      # RAG system tests
│
├── public/                                     # Static assets
├── start-rag-backend.sh                        # Convenience script to start backend
└── README.md                                   # This file
```

## 🔧 Configuration

### Supported Filter Types

The system automatically extracts these filters from natural language:

| Filter Type  | Example Query             | Extracted Filter                 |
| ------------ | ------------------------- | -------------------------------- |
| Price        | "under 15 lakhs"          | `price_max: 15.0`                |
| Price Range  | "between 10 and 20 lakhs" | `price_min: 10, price_max: 20`   |
| Body Type    | "SUV"                     | `body_type: "SUV"`               |
| Fuel Type    | "electric car"            | `fuel_type: "Electric"`          |
| Mileage      | "fuel efficient"          | `mileage_min: 18.0`              |
| Seating      | "7 seater"                | `seating_capacity: 7`            |
| Transmission | "automatic"               | `transmission_type: "Automatic"` |
| Segment      | "luxury sedan"            | `segment: "Luxury"`              |

### Environment Variables Explained

**MongoDB:**

- `MONGODB_URI` - Connection string from MongoDB Atlas
- `MONGODB_DATABASE` - Database name (default: `autoassist`)
- `MONGODB_COLLECTION` - Collection name (default: `cars_new`)

**Qdrant Cloud:**

- `QDRANT_URL` - Your cluster URL (format: `https://xxx.cloud.qdrant.io:6333`)
- `QDRANT_API_KEY` - API key from Qdrant dashboard
- `QDRANT_COLLECTION_NAME` - Collection name (default: `cars_rag`)

**Groq LLM:**

- `GROQ_API_KEY` - Free API key from console.groq.com
- `GROQ_MODEL` - Model name (options below)

**Groq Models (Fastest to Use):**

- `llama-3.1-70b-versatile` - Best for complex queries (recommended)
- `llama-3.1-8b-instant` - Fastest responses
- `mixtral-8x7b-32768` - Large context window
- `gemma2-9b-it` - Efficient alternative

## 🧪 Testing

### Test RAG System

```bash
# 1. Check environment
cd llm
source venv/bin/activate
python check_env.py

# 2. Test FastAPI backend
curl http://localhost:8000/health

# 3. Test query parsing and filtering
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "fuel efficient sedan under 15 lakhs with good safety"
  }' | python3 -m json.tool

# 4. Test via Next.js proxy
curl -X POST http://localhost:3000/api/ai/rag-chat \
  -H "Content-Type: application/json" \
  -d '{"query": "SUV under 20 lakhs"}' | python3 -m json.tool
```

### Example Queries to Test

```bash
# Price filtering
"cars under 10 lakhs"
"luxury sedan above 50 lakhs"
"between 15 and 25 lakhs"

# Feature-based
"fuel efficient sedan"
"electric car with good range"
"7 seater SUV"

# Combined constraints
"fuel efficient sedan under 15 lakhs with automatic transmission"
"electric SUV for family under 30 lakhs"
"luxury car with ADAS features"
```

## 🐛 Troubleshooting

### Backend Not Starting

```bash
# Check Python environment
cd llm
source venv/bin/activate
python check_env.py

# Reinstall dependencies
pip install -r requirements.txt

# Check if port 8000 is available
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows
```

### No Results / Empty Recommendations

```bash
# Check if embeddings exist
python -c "
from qdrant_client import QdrantClient
import os
from dotenv import load_dotenv
load_dotenv()
client = QdrantClient(url=os.getenv('QDRANT_URL'), api_key=os.getenv('QDRANT_API_KEY'))
print(f'Cars in Qdrant: {client.count(\"cars_rag\").count}')
"

# Re-embed if needed
python -m backend.rag.embed --mongodb --recreate
```

### MongoDB Connection Issues

```bash
# Test MongoDB connection
python -c "
from pymongo import MongoClient
import os
from dotenv import load_dotenv
load_dotenv()
client = MongoClient(os.getenv('MONGODB_URI'))
client.admin.command('ping')
print('✅ MongoDB connected!')
"

# Check SSL certificates (macOS)
/Applications/Python\ 3.12/Install\ Certificates.command
```

### Qdrant Timeout Errors

```bash
# Use smaller batch size for embedding
python -m backend.rag.embed --mongodb --recreate
# (Already configured with batch_size=20 and delays)

# Or embed subset for testing
python -c "
from backend.rag.mongodb_loader import load_cars_from_mongodb
from backend.rag.embed import embed_and_upsert, get_qdrant_client
from sentence_transformers import SentenceTransformer

cars = load_cars_from_mongodb(limit=200)  # First 200 cars
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
client = get_qdrant_client()
embed_and_upsert(cars, model, client, 'cars_rag', batch_size=20)
"
```

## 🚢 Deployment

### Vercel (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
# - MONGODB_URI
# - RAG_API_URL (your FastAPI deployment URL)
# - NEXT_PUBLIC_API_URL
```

### FastAPI Backend Options

**Option 1: Render.com (Recommended - Free tier)**

```bash
# 1. Push to GitHub
# 2. Connect Render to your repo
# 3. Configure:
#    - Root Directory: llm
#    - Build Command: pip install -r requirements.txt
#    - Start Command: uvicorn backend.main:app --host 0.0.0.0 --port $PORT
# 4. Add environment variables from .env
```

**Option 2: Railway.app**

```bash
# Similar to Render, but auto-detects Python
railway up
```

**Option 3: Docker**

```dockerfile
# Create Dockerfile in llm/
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# Build and run
cd llm
docker build -t autoassist-rag .
docker run -p 8000:8000 --env-file .env autoassist-rag
```

## 📊 Performance

- **Query Response Time**: 1-2 seconds (Groq)
- **Embedding Dimension**: 384 (MiniLM)
- **Cars Embedded**: 200+ (expandable to 742)
- **Filters Supported**: 10+ types
- **Concurrent Users**: Unlimited (cloud-native)

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

See [LICENSE](./LICENSE) file for details.

## 🔗 Resources

### Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [LangChain Docs](https://python.langchain.com/)
- [Qdrant Docs](https://qdrant.tech/documentation/)
- [Groq Docs](https://console.groq.com/docs)
- [MongoDB Atlas](https://www.mongodb.com/docs/atlas/)

### API Keys (Free Tiers)

- [Groq API](https://console.groq.com/keys) - Fast LLM inference
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) - Database
- [Qdrant Cloud](https://cloud.qdrant.io/) - Vector database

## ⭐ Show Your Support

If you find this project helpful, please give it a star!

---

**Built with ❤️ using Next.js, FastAPI, and RAG**

**Cloud Stack**: MongoDB Atlas • Qdrant Cloud • Groq • Vercel
