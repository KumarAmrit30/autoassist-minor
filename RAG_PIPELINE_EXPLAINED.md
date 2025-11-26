# 🔍 How Your RAG Pipeline Works - Complete Guide

This document explains the complete flow of your Retrieval-Augmented Generation (RAG) pipeline for car recommendations.

## 📊 Pipeline Overview

```
User Query → Frontend → Next.js API → FastAPI Backend → RAG Chain → LLM Response → Frontend Display
                                      ↓
                                 Query Parser (LLM)
                                      ↓
                                 Qdrant Vector DB
                                      ↓
                                 MongoDB (Car Data)
```

---

## 🔄 Complete Flow Breakdown

### **1. Data Ingestion & Embedding (One-Time Setup)**

#### Step 1.1: Data Loading (`mongodb_loader.py`)
- **Purpose**: Fetches car data from MongoDB Atlas
- **Location**: `llm/backend/rag/mongodb_loader.py`
- **Process**:
  1. Connects to MongoDB using `MONGODB_URI`
  2. Queries the `cars_new` collection
  3. Transforms MongoDB documents to RAG-friendly format:
     - Normalizes field names (e.g., "Identification Brand" → "make")
     - Converts prices from rupees to lakhs
     - Determines fuel type from engine specifications
     - Creates rich text descriptions for semantic search

#### Step 1.2: Description Generation
- **Function**: `create_description_from_record()`
- **Output**: Natural language descriptions like:
  ```
  "2024 Tata Nexon EV Max. SUV in the C-Segment segment. 
   Priced at ₹19.99 lakhs. Electric fuel type producing 143bhp. 
   Automatic transmission. Highly fuel efficient with excellent 453 kmpl mileage. 
   Safety features include 6 airbags, ABS, ESC. 
   Comfort features include sunroof, cruise control, keyless entry..."
  ```

#### Step 1.3: Embedding Generation (`embed.py`)
- **Purpose**: Converts car descriptions into vector embeddings
- **Location**: `llm/backend/rag/embed.py`
- **Process**:
  1. Loads SentenceTransformer model (`all-MiniLM-L6-v2` by default)
  2. Generates embeddings for each car description
  3. Creates Qdrant collection with:
     - Vector size: 384 dimensions
     - Distance metric: Cosine similarity
     - Payload indexes for filtering (price, mileage, body_type, etc.)

#### Step 1.4: Vector Storage (Qdrant)
- **What's Stored**:
  - **Vector**: 384-dim embedding of the car description
  - **Payload**: Complete car metadata (all fields from MongoDB)
  - **ID**: Unique identifier for each car

**To run this setup:**
```bash
cd llm/backend
python -m rag.embed --mongodb  # Load from MongoDB and create embeddings
```

---

### **2. Query Processing (Real-Time)**

#### Step 2.1: User Query → Frontend
- **Location**: `src/components/features/rag-recommendation-panel.tsx`
- User enters query: *"Show me fuel-efficient SUVs under 15 lakhs"*
- Frontend calls: `POST /api/ai/rag-chat`

#### Step 2.2: Next.js API Proxy (`route.ts`)
- **Location**: `src/app/api/ai/rag-chat/route.ts`
- **Role**: Proxy between Next.js frontend and FastAPI backend
- **Process**:
  1. Validates query
  2. Generates session ID if not provided
  3. Forwards request to FastAPI backend: `http://localhost:8000/chat`

#### Step 2.3: FastAPI Backend (`main.py`)
- **Location**: `llm/backend/main.py`
- **Endpoint**: `POST /chat`
- **Process**:

##### 2.3.1: Query Parser (`query_parser.py`)
- **Purpose**: Extract structured filters from natural language using LLM
- **How it works**:
  1. Uses the same LLM (Groq/Gemini/Ollama) to analyze query
  2. Extracts filters like:
     ```json
     {
       "body_type": "SUV",
       "price_max": 15.0,
       "mileage_min": 18.0
     }
     ```
  3. Handles phrases:
     - "under X lakhs" → `price_max: X`
     - "fuel efficient" → `mileage_min: 18`
     - "family car" → `seating_capacity: 7` or `body_type: SUV/MUV`

##### 2.3.2: Query Optimization
- **Purpose**: Clean query for better semantic search
- **Function**: `optimize_query_for_search()`
- **Process**:
  - Removes filter-related terms: "under", "lakhs", "minimum", etc.
  - Original: *"Show me fuel-efficient SUVs under 15 lakhs"*
  - Optimized: *"fuel efficient SUVs"*
  - **Why**: Semantic search works better on intent, not constraints

##### 2.3.3: RAG Chain Creation (`chain.py`)
- **Function**: `create_chain(filters, k=5)`
- **Components**:
  1. **LLM**: Gets LLM instance (prioritizes Groq → Gemini → Ollama)
  2. **Retriever**: Gets Qdrant retriever with metadata filters
  3. **Prompt Template**: Loads from `prompts/base_prompt.txt`
  4. **Memory**: Maintains conversation history (last 10 messages)

---

### **3. Retrieval Phase**

#### Step 3.1: Custom Qdrant Retriever (`retriever.py`)
- **Location**: `llm/backend/rag/retriever.py`
- **Class**: `CustomQdrantRetriever`
- **Process**:

##### 3.1.1: Query Embedding
- Converts optimized query to 384-dim vector using same embedding model

##### 3.1.2: Filter Building
- **Function**: `build_qdrant_filter()`
- Converts extracted filters to Qdrant Filter object:
  ```python
  Filter(
    must=[
      FieldCondition(key="body_type", match=MatchValue(value="SUV")),
      FieldCondition(key="price_lakhs", range=Range(lte=15.0)),
      FieldCondition(key="mileage", range=Range(gte=18.0))
    ]
  )
  ```

##### 3.1.3: Vector Search
- **Query**: Cosine similarity search with filters applied
- **Method**: `query_points()` with `NearestQuery`
- **Parameters**:
  - `query`: Query embedding vector
  - `limit`: Top K documents (default: 5)
  - `query_filter`: Metadata filter
  - `with_payload`: True (to get all car data)

##### 3.1.4: Document Extraction
- Retrieves top K matching cars
- Extracts:
  - `page_content`: Car description text (for LLM context)
  - `metadata`: All car fields (price, mileage, features, etc.)
- Returns: List of LangChain `Document` objects

---

### **4. Generation Phase**

#### Step 4.1: Context Formatting (`chain.py`)
- **Function**: `format_docs()`
- Combines retrieved documents into context string:
  ```
  Document 1: "2024 Tata Nexon. SUV in C-Segment..."
  Document 2: "2024 Mahindra XUV700. SUV in D-Segment..."
  ...
  ```

#### Step 4.2: Prompt Construction
- **Template**: `prompts/base_prompt.txt`
- **Variables**:
  - `{context}`: Formatted car descriptions from retrieval
  - `{chat_history}`: Previous conversation (last 5 messages)
  - `{question}`: User's query

#### Step 4.3: LLM Generation
- **Model**: Groq (Llama 3.1 70B) / Gemini / Ollama
- **Input**: Formatted prompt with context
- **Output**: Natural language response with:
  - Summary matching user needs
  - Top 3-5 recommendations with specific details
  - Comparison of trade-offs

#### Step 4.4: Response Processing
- **Function**: `query_chain()`
- Extracts:
  1. **Answer**: LLM-generated response text
  2. **Recommended Cars**: Metadata from source documents
     - Includes: id, name, make, model, price, mileage, features
  3. **Sources**: Source document info for transparency

---

### **5. Response Enrichment (Next.js)**

#### Step 5.1: Car Data Enrichment
- **Location**: `src/app/api/ai/rag-chat/route.ts`
- **Purpose**: Fetch full car details from MongoDB via Next.js API
- **Process**:
  1. For each recommended car:
     - First tries: `GET /api/cars/{id}` (using MongoDB _id)
     - Fallback: `GET /api/cars?search={make} {model}&limit=1`
  2. Enriches recommendations with:
     - Images, full specifications
     - Consistent data format matching frontend Car type

#### Step 5.2: Response Formatting
- Returns:
  ```json
  {
    "response": "AI-generated answer text",
    "recommendations": [/* Full car objects */],
    "sources": [/* Source metadata */],
    "metadata": {
      "sessionId": "...",
      "timestamp": "...",
      "backend": "rag"
    }
  }
  ```

---

### **6. Frontend Display**

#### Step 6.1: UI Component
- **Location**: `src/components/features/rag-recommendation-panel.tsx`
- **Displays**:
  1. **AI Analysis Section**: LLM-generated response
  2. **Recommendations Grid**: Car cards with:
     - Images
     - Price, mileage, key features
     - Action buttons (View Details, Compare, Favorite)
  3. **Sources**: Data provenance info

---

## 🔧 Key Components Summary

### **Backend Components**

| Component | File | Purpose |
|-----------|------|---------|
| **Data Loader** | `mongodb_loader.py` | Fetch & transform MongoDB car data |
| **Embedding Generator** | `embed.py` | Generate vectors & store in Qdrant |
| **Vector Retriever** | `retriever.py` | Semantic search with metadata filtering |
| **Query Parser** | `query_parser.py` | Extract filters from natural language |
| **RAG Chain** | `chain.py` | Orchestrates retrieval + generation |
| **LLM Wrapper** | `model.py` | LLM abstraction (Groq/Gemini/Ollama) |
| **FastAPI Server** | `main.py` | REST API endpoint `/chat` |

### **Frontend Components**

| Component | File | Purpose |
|-----------|------|---------|
| **API Proxy** | `rag-chat/route.ts` | Next.js proxy to FastAPI |
| **UI Panel** | `rag-recommendation-panel.tsx` | Display recommendations |
| **RAG Client** | `rag-client.ts` | TypeScript client for RAG API |

---

## 🔑 Key Features

### **1. Hybrid Search**
- **Semantic Search**: Vector similarity (understands intent)
- **Metadata Filtering**: Exact matches (price, body type, features)
- **Combined**: Both filters applied for precise results

### **2. Intelligent Filter Extraction**
- LLM extracts structured filters from natural language
- Handles implicit requirements:
  - "fuel efficient" → `mileage_min: 18`
  - "family car" → `seating_capacity: 7`
  - "luxury" → `segment: Luxury`

### **3. Conversation Memory**
- Maintains chat history (last 10 messages)
- Context-aware responses
- Follow-up questions work naturally

### **4. Multi-Model Support**
- **Groq**: Fastest, production-ready (recommended)
- **Gemini**: Google's API
- **Ollama**: Local development
- Automatic fallback if one fails

### **5. Rich Descriptions**
- Cars described in natural language
- Includes: specs, features, pricing, safety, comfort
- Optimized for semantic search

---

## 🚀 How to Use

### **Setup (One-Time)**
```bash
# 1. Install dependencies
cd llm
pip install -r requirements.txt

# 2. Set environment variables (.env)
MONGODB_URI=...
QDRANT_URL=...
GROQ_API_KEY=...  # or GEMINI_API_KEY

# 3. Create embeddings
cd backend
python -m rag.embed --mongodb
```

### **Run Backend**
```bash
cd llm/backend
uvicorn main:app --reload --port 8000
```

### **Run Frontend**
```bash
npm run dev  # Next.js on port 3000
```

### **Test Query**
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Show me fuel-efficient SUVs under 15 lakhs",
    "session_id": "test123"
  }'
```

---

## 📈 Performance Optimizations

1. **Batch Embedding**: Processes cars in batches (50 at a time)
2. **Session Caching**: Chains cached per session to avoid recreation
3. **Payload Indexes**: Qdrant indexes for fast filtering
4. **Query Optimization**: Removes filter terms for better semantic search
5. **Selective Retrieval**: Only fetches top K most relevant cars

---

## 🎯 Why This Architecture?

### **Benefits**:
- ✅ **Accurate**: Semantic search finds cars matching user intent
- ✅ **Fast**: Vector search is sub-100ms
- ✅ **Flexible**: Handles natural language queries
- ✅ **Scalable**: Qdrant handles millions of vectors
- ✅ **Contextual**: LLM generates natural responses
- ✅ **Transparent**: Shows source documents

### **Trade-offs**:
- ⚠️ Requires one-time embedding setup
- ⚠️ Needs Qdrant running (can be cloud or local)
- ⚠️ LLM API costs (Groq is free tier friendly)

---

## 🔍 Example Flow Walkthrough

**User Query**: *"I need a safe family car with good mileage under 12 lakhs"*

1. **Query Parser** extracts:
   ```json
   {
     "seating_capacity": 7,
     "price_max": 12.0,
     "mileage_min": 18.0,
     "airbags_min": 6
   }
   ```

2. **Optimized Query**: *"safe family car good mileage"*

3. **Retrieval**:
   - Searches Qdrant for semantic matches
   - Filters by: price ≤ 12L, mileage ≥ 18, airbags ≥ 6
   - Returns top 5 cars: Tata Nexon, Mahindra XUV300, etc.

4. **LLM Generation**:
   - Receives context with 5 car descriptions
   - Generates response highlighting safety, fuel efficiency
   - Recommends top matches with specific details

5. **Response**: Formatted JSON with recommendations
6. **Frontend**: Displays car cards with images and details

---

This is a **production-ready RAG system** that combines the best of semantic search, structured filtering, and natural language generation! 🚀

