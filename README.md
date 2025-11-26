# AutoAssist - AI-Powered Car Recommendation Platform

An intelligent car recommendation platform using RAG (Retrieval-Augmented Generation) with Next.js frontend and FastAPI backend.

## Prerequisites

Install the following before starting:

1. **Node.js 18+** - [Download here](https://nodejs.org/)
2. **Python 3.10+** - [Download here](https://www.python.org/downloads/)
3. **Git** - [Download here](https://git-scm.com/downloads)

## Cloud Services (Free Tier)

Sign up for these services:

1. **MongoDB Atlas** - [Sign up](https://www.mongodb.com/cloud/atlas/register)
2. **Qdrant Cloud** - [Sign up](https://cloud.qdrant.io/)
3. **Groq API** - [Get API key](https://console.groq.com/keys)

## Installation

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd autoassist-minor
```

### 2. Install Node.js Dependencies

```bash
npm install
```

### 3. Setup Python Environment

**macOS/Linux:**

```bash
cd llm
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

**Windows:**

```bash
cd llm
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 4. Configure Environment Variables

**Create `.env.local` in project root:**

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DATABASE=autoassist
MONGODB_COLLECTION=cars_new
RAG_API_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Create `.env` in `llm/` directory:**

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DATABASE=autoassist
MONGODB_COLLECTION=cars_new

# Qdrant Cloud
QDRANT_URL=https://your-cluster.cloud.qdrant.io:6333
QDRANT_API_KEY=your-qdrant-api-key
QDRANT_COLLECTION_NAME=cars_rag

# Groq
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=llama-3.1-70b-versatile

# Embeddings
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
EMBEDDING_DIMENSION=384
RETRIEVAL_K=5
USE_MONGODB=true
```

### 5. Load Data and Create Embeddings

**macOS/Linux:**

```bash
cd llm
source venv/bin/activate
python check_env.py
python -m backend.rag.embed --mongodb --recreate
cd ..
```

**Windows:**

```bash
cd llm
venv\Scripts\activate
python check_env.py
python -m backend.rag.embed --mongodb --recreate
cd ..
```

## Running the Application

Open **2 terminals**:

### Terminal 1: Start Backend

**macOS/Linux:**

```bash
./start-rag-backend.sh
```

**Windows:**

```bash
cd llm
venv\Scripts\activate
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 2: Start Frontend

```bash
npm run dev
```

### Access Application

Open **http://localhost:3000** in your browser.

## Testing

Test the backend is running:

```bash
curl http://localhost:8000/health
```

Test RAG query:

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "fuel efficient sedan under 15 lakhs"}'
```

## Example Queries

Try these queries in the application:

- "fuel efficient sedan under 15 lakhs"
- "SUV for family with good safety features"
- "electric car with good range"
- "luxury sedan above 50 lakhs"

## Common Issues

### Backend Won't Start

```bash
cd llm
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate     # Windows

python check_env.py
pip install -r requirements.txt
```

### No Recommendations Returned

```bash
cd llm
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate     # Windows

# Verify embeddings exist
python -c "from qdrant_client import QdrantClient; import os; from dotenv import load_dotenv; load_dotenv(); client = QdrantClient(url=os.getenv('QDRANT_URL'), api_key=os.getenv('QDRANT_API_KEY')); print(f'Cars in DB: {client.count(\"cars_rag\").count}')"

# Re-create embeddings if needed
python -m backend.rag.embed --mongodb --recreate
```

### Port Already in Use

**macOS/Linux:**

```bash
lsof -i :8000  # Find process using port 8000
kill -9 <PID>  # Kill the process
```

**Windows:**

```bash
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

## Technology Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python
- **AI/RAG**: LangChain, Groq, SentenceTransformers
- **Databases**: MongoDB Atlas, Qdrant Cloud

## Available Scripts

```bash
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm run start        # Start production server
npm run rag:start    # Start RAG backend (macOS/Linux only)
npm run rag:health   # Check backend health
npm run rag:test     # Test RAG query
```

## License

See [LICENSE](./LICENSE) file for details.
