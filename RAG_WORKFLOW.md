# 🔄 RAG Pipeline & Backend Workflow

Complete workflow documentation for the Retrieval-Augmented Generation (RAG) system for car recommendations.

---

## 📋 Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Initialization Workflow](#initialization-workflow)
3. [Real-Time Query Processing Workflow](#real-time-query-processing-workflow)
4. [Component Interactions](#component-interactions)
5. [Data Flow Diagrams](#data-flow-diagrams)
6. [API Endpoints & Request Flow](#api-endpoints--request-flow)
7. [Error Handling & Fallbacks](#error-handling--fallbacks)

---

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Next.js App (React/TypeScript)                          │   │
│  │  - AI Chat Interface Component                           │   │
│  │  - RAG Recommendation Panel                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP POST /api/ai/rag-chat
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS API LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  /api/ai/rag-chat/route.ts                              │   │
│  │  - Request validation                                    │   │
│  │  - Session management                                    │   │
│  │  - Proxy to FastAPI backend                             │   │
│  │  - Response enrichment (fetch full car data)            │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP POST http://localhost:8000/chat
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND LAYER                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  main.py - /chat endpoint                                │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  Step 1: Query Understanding (query_understanding) │  │   │
│  │  │  - Analyze query with LLM (Gemini/Groq)           │  │   │
│  │  │  - Extract filters & search keywords               │  │   │
│  │  │  - Combine with chat history context              │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  Step 2: RAG Chain (chain.py)                     │  │   │
│  │  │  - Create/retrieve ConversationalRetrievalChain    │  │   │
│  │  │  - Query with optimized search keywords            │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  Step 3: Response Refinement (refiner.py)         │  │   │
│  │  │  - Enhance RAG response with LLM                   │  │   │
│  │  │  - Add general automotive knowledge                │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│   RAG CHAIN COMPONENTS    │    │   VECTOR DATABASE        │
│  ┌────────────────────┐  │    │  ┌────────────────────┐ │
│  │  retriever.py      │  │    │  │  Qdrant Vector DB  │ │
│  │  - CustomQdrant   │◄─┼────┼──┤  │  - 384-dim vectors │ │
│  │    Retriever      │  │    │  │  - Metadata filters │ │
│  └────────────────────┘  │    │  │  - Payload indexes │ │
│  ┌────────────────────┐  │    │  └────────────────────┘ │
│  │  model.py          │  │    └──────────────────────────┘
│  │  - LLM wrapper     │  │
│  │  (Groq/Gemini)     │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │  embed.py          │  │
│  │  - Embeddings      │  │
│  └────────────────────┘  │
└──────────────────────────┘
                │
                ▼
┌──────────────────────────┐
│   DATA SOURCE LAYER       │
│  ┌────────────────────┐  │
│  │  MongoDB Atlas    │  │
│  │  - Car database    │  │
│  │  - Full specs     │  │
│  └────────────────────┘  │
└──────────────────────────┘
```

---

## 🔧 Initialization Workflow

### Phase 1: Data Preparation & Embedding

**Purpose**: One-time setup to create vector embeddings from car data

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Data Loading                                        │
│ ────────────────────────────────────────────────────────── │
│ File: llm/backend/rag/mongodb_loader.py                     │
│                                                             │
│ 1. Connect to MongoDB Atlas                                 │
│    - Use MONGODB_URI from .env                             │
│    - Access collection: cars_new                            │
│                                                             │
│ 2. Fetch car documents                                      │
│    - Query all cars (or limit if specified)                │
│    - Transform MongoDB schema to RAG format                 │
│                                                             │
│ 3. Field Transformation:                                     │
│    "Identification Brand" → "make"                          │
│    "Pricing Delhi Ex Showroom Price" → "price_lakhs"        │
│    "Engine Type" → "fuel_type"                              │
│    ... (all fields normalized)                              │
│                                                             │
│ 4. Generate Rich Descriptions                                │
│    - create_description_from_record()                       │
│    - Natural language text combining:                        │
│      • Make, Model, Variant, Year                           │
│      • Body type, Segment                                   │
│      • Price in ₹ lakhs                                     │
│      • Engine specs (power, torque, displacement)            │
│      • Fuel efficiency (mileage)                            │
│      • Safety features (airbags, ABS, ESC)                  │
│      • Comfort features (sunroof, cruise control)           │
│      • Infotainment features                                │
│      • ADAS features                                        │
│      • Practicality (seating, boot space)                   │
│                                                             │
│ Output: List of car records with "description" field       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Embedding Generation                                 │
│ ────────────────────────────────────────────────────────── │
│ File: llm/backend/rag/embed.py                              │
│                                                             │
│ 1. Load Embedding Model                                     │
│    - Model: sentence-transformers/all-MiniLM-L6-v2          │
│    - Vector size: 384 dimensions                            │
│    - Device: CPU (or GPU if available)                      │
│                                                             │
│ 2. Generate Embeddings                                      │
│    - Input: Car descriptions (text strings)                 │
│    - Process in batches (default: 50 cars/batch)            │
│    - Output: 384-dim vectors for each car                  │
│                                                             │
│ 3. Prepare Qdrant Points                                     │
│    For each car:                                            │
│    - Vector: 384-dim embedding                             │
│    - Payload: Complete car metadata (all fields)            │
│      • Includes: make, model, price, mileage, features...   │
│      • Special field: "page_content" = description text    │
│    - ID: Sequential index or unique identifier             │
│                                                             │
│ 4. Create Qdrant Collection                                  │
│    - Collection name: "cars_rag" (from env)                │
│    - Vector config:                                         │
│      • Size: 384                                            │
│      • Distance: Cosine similarity                          │
│    - Create payload indexes for filtering:                  │
│      • price_lakhs (FLOAT)                                  │
│      • body_type (KEYWORD)                                  │
│      • fuel_type (KEYWORD)                                  │
│      • segment (KEYWORD)                                   │
│      • mileage (FLOAT)                                      │
│      • year (INTEGER)                                       │
│      • transmission_type (KEYWORD)                          │
│      • power_bhp (FLOAT)                                    │
│      • airbags (INTEGER)                                    │
│      • make (KEYWORD)                                       │
│      • model (KEYWORD)                                      │
│                                                             │
│ 5. Upsert to Qdrant                                         │
│    - Batch upsert (50 points at a time)                     │
│    - Store vectors + metadata in Qdrant                      │
│                                                             │
│ Output: Qdrant collection with all car embeddings          │
└─────────────────────────────────────────────────────────────┘
```

**Command to Run**:
```bash
cd llm/backend
python -m rag.embed --mongodb
```

---

## 🔄 Real-Time Query Processing Workflow

### Complete Request Flow

```
USER QUERY: "Show me fuel-efficient SUVs under 15 lakhs"
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: Frontend Request                                    │
│ ────────────────────────────────────────────────────────── │
│ Component: src/components/features/ai-chat-interface.tsx    │
│                                                             │
│ 1. User types query in chat input                           │
│ 2. On submit, calls: POST /api/ai/rag-chat                 │
│    Body: {                                                  │
│      query: "Show me fuel-efficient SUVs under 15 lakhs",   │
│      session_id: "session_123..." (or auto-generated)      │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: Next.js API Proxy                                  │
│ ────────────────────────────────────────────────────────── │
│ File: src/app/api/ai/rag-chat/route.ts                      │
│                                                             │
│ 1. Validate request                                         │
│    - Check query is non-empty string                        │
│                                                             │
│ 2. Generate/use session ID                                  │
│    - Use provided session_id or generate new one           │
│                                                             │
│ 3. Forward to FastAPI backend                               │
│    POST http://localhost:8000/chat                          │
│    Headers: Content-Type: application/json                  │
│    Body: {                                                  │
│      query: "...",                                          │
│      session_id: "...",                                     │
│      filters: null (optional)                              │
│    }                                                        │
│                                                             │
│ 4. Wait for FastAPI response                                │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: FastAPI Backend - Query Understanding             │
│ ────────────────────────────────────────────────────────── │
│ File: llm/backend/main.py - /chat endpoint                │
│                                                             │
│ STEP 3.1: Load Chat History                                 │
│    - Retrieve session history from session_histories dict  │
│    - Get last 10 message pairs (Q, A)                       │
│                                                             │
│ STEP 3.2: Query Understanding (query_understanding.py)      │
│    Function: understand_query_with_llm()                   │
│                                                             │
│    a) Build prompt with:                                    │
│       - Current query                                        │
│       - Chat history (last 3 exchanges)                     │
│       - Instructions for intent extraction                   │
│                                                             │
│    b) Call LLM (Groq/Gemini):                              │
│       - Model: llama-3.3-70b-versatile (Groq)              │
│       - Temperature: 0.3 (structured output)                │
│                                                             │
│    c) Parse JSON response:                                  │
│       {                                                      │
│         "combined_intent": "User wants fuel-efficient...", │
│         "filters": {                                        │
│           "body_type": "SUV",                               │
│           "price_max": 15.0,                                │
│           "mileage_min": 18.0                               │
│         },                                                  │
│         "search_keywords": "fuel efficient SUV",            │
│         "context_notes": "..."                              │
│       }                                                     │
│                                                             │
│    Output:                                                  │
│    - auto_filters: Extracted filter dictionary              │
│    - search_keywords: Optimized query for semantic search  │
│    - combined_intent: Full understanding of user need      │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 4: Filter Merging & Chain Creation                    │
│ ────────────────────────────────────────────────────────── │
│ File: llm/backend/main.py                                  │
│                                                             │
│ STEP 4.1: Merge Filters                                      │
│    - Start with auto_filters from query understanding      │
│    - Merge with explicit filters (if provided)              │
│    - Explicit filters take precedence                       │
│    - Result: final_filters = {                              │
│        "body_type": "SUV",                                  │
│        "price_max": 15.0,                                  │
│        "mileage_min": 18.0                                 │
│      }                                                      │
│                                                             │
│ STEP 4.2: Get or Create Chain                               │
│    Function: get_or_create_chain()                         │
│                                                             │
│    a) Check if chain exists for session + filters           │
│       - Key: f"{session_id}_{hash(filters)}"               │
│                                                             │
│    b) If not exists, create new chain:                     │
│       Function: create_chain(filters, k=8)                 │
│                                                             │
│       i) Get LLM (model.py):                                │
│          - Try Groq first (fastest)                         │
│          - Fallback to Gemini                               │
│          - Fallback to Ollama (local dev)                   │
│                                                             │
│       ii) Get Retriever (retriever.py):                     │
│          Function: get_retriever(filters, k=8)             │
│                                                             │
│          • Initialize embeddings model                      │
│            (same as embedding: all-MiniLM-L6-v2)            │
│          • Get Qdrant client                                │
│          • Build Qdrant filter from filters dict            │
│          • Create CustomQdrantRetriever                     │
│                                                             │
│       iii) Load prompt template                             │
│          - File: prompts/base_prompt.txt                    │
│                                                             │
│       iv) Create ConversationalRetrievalChain               │
│          - Combines LLM + Retriever + Prompt                │
│          - Uses LCEL (LangChain Expression Language)         │
│                                                             │
│    c) Cache chain in session_chains dict                    │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 5: Retrieval Phase                                    │
│ ────────────────────────────────────────────────────────── │
│ File: llm/backend/rag/retriever.py                         │
│ Class: CustomQdrantRetriever                               │
│                                                             │
│ STEP 5.1: Query Embedding                                   │
│    - Input: "fuel efficient SUV" (optimized keywords)      │
│    - Generate 384-dim vector using embedding model         │
│    - Same model used during initialization                  │
│                                                             │
│ STEP 5.2: Build Qdrant Filter                               │
│    Function: build_qdrant_filter(final_filters)             │
│                                                             │
│    Convert filters to Qdrant Filter object:                 │
│    Filter(                                                  │
│      must=[                                                 │
│        FieldCondition(                                      │
│          key="body_type",                                   │
│          match=MatchValue(value="SUV")                      │
│        ),                                                   │
│        FieldCondition(                                      │
│          key="price_lakhs",                                 │
│          range=Range(lte=15.0)                              │
│        ),                                                   │
│        FieldCondition(                                      │
│          key="mileage",                                     │
│          range=Range(gte=18.0)                              │
│        )                                                    │
│      ]                                                      │
│    )                                                        │
│                                                             │
│ STEP 5.3: Vector Similarity Search                          │
│    - Query Qdrant with:                                    │
│      • query: NearestQuery(nearest=query_embedding)        │
│      • limit: 8 (top K documents)                          │
│      • query_filter: Filter object (from step 5.2)         │
│      • with_payload: True (get all metadata)                │
│                                                             │
│    - Qdrant returns:                                        │
│      • Top 8 most similar cars                              │
│      • Each with:                                           │
│        - Similarity score                                   │
│        - Full payload (all car metadata)                    │
│                                                             │
│ STEP 5.4: Document Extraction                               │
│    - Convert Qdrant points to LangChain Documents          │
│    - For each point:                                         │
│      • page_content = payload["page_content"]              │
│        (the car description text)                           │
│      • metadata = all other payload fields                 │
│        (make, model, price, mileage, features...)          │
│                                                             │
│    Output: List of Document objects                        │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 6: Generation Phase                                   │
│ ────────────────────────────────────────────────────────── │
│ File: llm/backend/rag/chain.py                             │
│ Class: ConversationalRetrievalChain                        │
│                                                             │
│ STEP 6.1: Format Context                                    │
│    Function: format_docs(documents)                         │
│                                                             │
│    Combine retrieved documents into context string:        │
│    """                                                      │
│    --- Car 1 ---                                            │
│    Description: 2024 Tata Nexon. SUV in C-Segment...        │
│    Brand: Tata | Model: Nexon | Price: ₹15.50 lakhs...     │
│                                                             │
│    --- Car 2 ---                                            │
│    Description: 2024 Mahindra XUV300. SUV...               │
│    ...                                                      │
│    """                                                      │
│                                                             │
│ STEP 6.2: Format Chat History                                │
│    Function: format_chat_history(history)                   │
│    - Convert last 5 message pairs to text                   │
│    - Format: "Human: ...\nAI: ..."                         │
│                                                             │
│ STEP 6.3: Build Prompt                                      │
│    - Load template: prompts/base_prompt.txt                 │
│    - Fill variables:                                        │
│      • {context} = formatted car descriptions             │
│      • {question} = user query                             │
│      • {chat_history} = formatted history                  │
│                                                             │
│ STEP 6.4: LLM Generation                                     │
│    - Input: Complete prompt with context                    │
│    - Model: Groq (llama-3.3-70b-versatile)                  │
│    - Temperature: 0.4 (factual responses)                  │
│    - Max tokens: 3072                                       │
│                                                             │
│    - LLM generates natural language response:                │
│      "Based on your requirements, here are my top picks:     │
│                                                             │
│      • Tata Nexon XZ+ at ₹15.50 lakhs - Excellent fuel...  │
│      • Mahindra XUV300 W8 at ₹14.20 lakhs - Great value...  │
│      ..."                                                    │
│                                                             │
│ STEP 6.5: Post-Process Answer                                │
│    Function: post_process_answer(raw_answer)                │
│    - Remove markdown artifacts                              │
│    - Clean formatting                                        │
│    - Ensure consistent bullet points                        │
│                                                             │
│ STEP 6.6: Extract Recommendations                           │
│    Function: query_chain()                                  │
│                                                             │
│    From source documents, extract:                          │
│    - De-duplicate by brand+model                            │
│    - Format car info:                                        │
│      {                                                       │
│        id: MongoDB _id,                                     │
│        name: "Tata Nexon",                                  │
│        make: "Tata",                                        │
│        model: "Nexon",                                      │
│        price: 15.50,                                        │
│        mileage: 18.2,                                       │
│        ... (other fields)                                   │
│      }                                                      │
│                                                             │
│    Output:                                                  │
│    {                                                        │
│      answer: "Based on your requirements...",               │
│      recommended: [car1, car2, ...],                        │
│      sources: [doc1_info, doc2_info, ...]                  │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 7: Response Refinement                                │
│ ────────────────────────────────────────────────────────── │
│ File: llm/backend/rag/refiner.py                           │
│                                                             │
│ STEP 7.1: Refine with LLM                                    │
│    Function: refine_response_with_llm()                    │
│                                                             │
│    a) Build refinement prompt:                              │
│       - Original query                                       │
│       - RAG response (from Phase 6)                         │
│       - Recommended cars list                                │
│       - Chat history context                                 │
│                                                             │
│    b) Call LLM (Groq/Gemini):                              │
│       - Model: llama-3.3-70b-versatile                      │
│       - Temperature: 0.5 (more natural language)             │
│       - Purpose: Enhance with general automotive knowledge  │
│                                                             │
│    c) LLM enhances response:                                 │
│       - More conversational tone                            │
│       - Better structure                                     │
│       - Additional context from general knowledge            │
│       - Natural transitions                                  │
│                                                             │
│    Output: Refined answer string                            │
│                                                             │
│ STEP 7.2: Update Chat History                                │
│    - Add (query, refined_answer) to session history          │
│    - Keep only last 10 exchanges                            │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 8: Response Enrichment (Next.js)                      │
│ ────────────────────────────────────────────────────────── │
│ File: src/app/api/ai/rag-chat/route.ts                     │
│                                                             │
│ STEP 8.1: Enrich Recommendations                            │
│    For each recommended car:                                │
│                                                             │
│    a) Try fetching by MongoDB ID:                           │
│       GET /api/cars/{id}                                    │
│       - Use car.id from RAG response                        │
│                                                             │
│    b) If fails, search by brand+model:                      │
│       GET /api/cars?search={make} {model}&limit=1           │
│                                                             │
│    c) Enrich with full car data:                            │
│       - Images                                              │
│       - Complete specifications                             │
│       - Consistent format matching frontend Car type        │
│                                                             │
│ STEP 8.2: Format Final Response                             │
│    {                                                        │
│      response: "Refined answer text...",                   │
│      recommendations: [enriched_car1, enriched_car2, ...],  │
│      sources: [...],                                        │
│      metadata: {                                            │
│        sessionId: "...",                                    │
│        timestamp: "...",                                    │
│        backend: "rag",                                      │
│        originalCount: 8,                                   │
│        enrichedCount: 5                                     │
│      }                                                      │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 9: Frontend Display                                   │
│ ────────────────────────────────────────────────────────── │
│ Component: src/components/features/rag-recommendation-panel│
│                                                             │
│ 1. Display AI Response                                      │
│    - Show refined answer in chat interface                   │
│    - Format with proper styling                             │
│                                                             │
│ 2. Display Recommendations                                  │
│    - Render car cards in grid                               │
│    - Each card shows:                                        │
│      • Car image                                            │
│      • Name (make + model + variant)                       │
│      • Price in ₹ lakhs                                    │
│      • Mileage in kmpl                                     │
│      • Key features                                         │
│      • Action buttons (View, Compare, Favorite)            │
│                                                             │
│ 3. Display Sources (optional)                                │
│    - Show data provenance                                   │
│    - Transparency about data source                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 Component Interactions

### Component Dependency Graph

```
main.py (FastAPI)
  │
  ├─► query_understanding.py
  │     └─► model.py (get_llm) ──► Groq/Gemini API
  │
  ├─► chain.py (create_chain)
  │     ├─► model.py (get_llm) ──► Groq/Gemini API
  │     ├─► retriever.py (get_retriever)
  │     │     ├─► embed.py (HuggingFaceEmbeddings)
  │     │     └─► Qdrant Client ──► Qdrant Vector DB
  │     └─► prompts/base_prompt.txt
  │
  └─► refiner.py
        └─► Groq/Gemini API

retriever.py
  ├─► embed.py (SentenceTransformer)
  └─► Qdrant Client

embed.py (Initialization)
  ├─► mongodb_loader.py ──► MongoDB Atlas
  └─► Qdrant Client
```

### Data Flow Between Components

```
User Query
    │
    ▼
[main.py] ──► [query_understanding.py] ──► LLM API
    │                                         │
    │                                         ▼
    │                                    Understanding JSON
    │                                         │
    │                                         ▼
    ├─► [chain.py] ──► [retriever.py] ──► Qdrant
    │         │              │                │
    │         │              │                ▼
    │         │              └─► Documents (with metadata)
    │         │                    │
    │         │                    ▼
    │         └─► Format Context ──► LLM API
    │                                    │
    │                                    ▼
    │                                RAG Response
    │                                    │
    │                                    ▼
    └─► [refiner.py] ──► LLM API ──► Refined Response
                              │
                              ▼
                        Final Answer + Recommendations
```

---

## 📊 Data Flow Diagrams

### 1. Initialization Data Flow

```
MongoDB Atlas
    │
    │ (Fetch car documents)
    ▼
[mongodb_loader.py]
    │
    │ (Transform & create descriptions)
    ▼
Car Records (with "description" field)
    │
    │ (Generate embeddings)
    ▼
[embed.py]
    │
    │ (384-dim vectors + metadata)
    ▼
Qdrant Vector DB
    │
    └─► Stored as:
        - Vector: [0.123, -0.456, ...] (384 dims)
        - Payload: {make, model, price, mileage, ...}
        - ID: unique identifier
```

### 2. Query Processing Data Flow

```
User Query: "fuel efficient SUV under 15 lakhs"
    │
    ▼
[Query Understanding]
    │
    ├─► Filters: {body_type: "SUV", price_max: 15.0, mileage_min: 18.0}
    └─► Keywords: "fuel efficient SUV"
         │
         ▼
    [Embedding Model]
         │
         ▼
    Query Vector: [0.789, -0.234, ...] (384 dims)
         │
         ▼
    [Qdrant Search]
         │
         ├─► Vector Similarity (Cosine)
         └─► Metadata Filter (body_type=SUV, price≤15, mileage≥18)
              │
              ▼
    Top 8 Matching Cars
         │
         ├─► page_content: "2024 Tata Nexon. SUV..."
         └─► metadata: {make: "Tata", model: "Nexon", price: 15.50, ...}
              │
              ▼
    [LLM Generation]
         │
         ▼
    RAG Answer: "Based on your requirements..."
         │
         ▼
    [Refinement]
         │
         ▼
    Final Answer + Recommendations
```

---

## 🌐 API Endpoints & Request Flow

### Endpoint: `POST /api/ai/rag-chat`

**Request**:
```json
{
  "query": "Show me fuel-efficient SUVs under 15 lakhs",
  "session_id": "session_1234567890" // optional
}
```

**Response**:
```json
{
  "response": "Based on your requirements, here are my top picks:\n\n• Tata Nexon...",
  "recommendations": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "brand": "Tata",
      "model": "Nexon",
      "price": 15.50,
      "mileage": 18.2,
      "images": [...],
      ...
    }
  ],
  "sources": [...],
  "metadata": {
    "sessionId": "session_1234567890",
    "timestamp": "2024-01-15T10:30:00Z",
    "backend": "rag",
    "originalCount": 8,
    "enrichedCount": 5
  }
}
```

### Internal FastAPI Endpoint: `POST http://localhost:8000/chat`

**Request**:
```json
{
  "query": "Show me fuel-efficient SUVs under 15 lakhs",
  "session_id": "session_1234567890",
  "filters": null // optional explicit filters
}
```

**Response**:
```json
{
  "answer": "Based on your requirements...",
  "recommended": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Tata Nexon",
      "make": "Tata",
      "model": "Nexon",
      "price": 15.50,
      "mileage": 18.2
    }
  ],
  "sources": [
    {
      "content": "2024 Tata Nexon. SUV in C-Segment...",
      "metadata": {...}
    }
  ]
}
```

---

## ⚠️ Error Handling & Fallbacks

### Error Handling Strategy

```
┌─────────────────────────────────────────────────────────┐
│ Error: LLM API Failure (Groq/Gemini)                    │
│ ─────────────────────────────────────────────────────── │
│ 1. Try Groq first                                       │
│ 2. If fails → Try Gemini                                │
│ 3. If fails → Try Ollama (local dev)                    │
│ 4. If all fail → Return error with helpful message      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Error: Qdrant Connection Failure                        │
│ ─────────────────────────────────────────────────────── │
│ 1. Check QDRANT_URL in .env                             │
│ 2. Verify Qdrant is running                             │
│ 3. Check network connectivity                            │
│ 4. Return 503 with connection error message             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Error: Missing Qdrant Index                             │
│ ─────────────────────────────────────────────────────── │
│ 1. Retry query without filter                           │
│ 2. Log warning about missing index                      │
│ 3. Continue with semantic search only                    │
│ 4. Note: Results may be less precise                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Error: Car Enrichment Failure (Next.js)                 │
│ ─────────────────────────────────────────────────────── │
│ 1. Try fetching by MongoDB ID                           │
│ 2. If fails → Try search by brand+model                │
│ 3. If fails → Return null, filter out in response       │
│ 4. Continue with successfully enriched cars             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Error: Empty Retrieval Results                          │
│ ─────────────────────────────────────────────────────── │
│ 1. LLM generates response acknowledging no matches     │
│ 2. Suggests alternative criteria                        │
│ 3. Uses general automotive knowledge                    │
│ 4. Provides helpful guidance                            │
└─────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Configuration Points

### Environment Variables

```bash
# LLM Configuration
GROQ_API_KEY=...              # Primary (fastest)
GEMINI_API_KEY=...            # Fallback
OLLAMA_URL=http://localhost:11434  # Local dev

# Vector Database
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=...            # For Qdrant Cloud
QDRANT_COLLECTION_NAME=cars_rag

# Embeddings
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
RETRIEVAL_K=8                 # Number of docs to retrieve

# Data Source
MONGODB_URI=...               # MongoDB Atlas connection
MONGODB_DATABASE=autoassist
MONGODB_COLLECTION=cars_new

# Backend
RAG_API_URL=http://localhost:8000  # FastAPI backend URL
```

### Tuning Parameters

- **RETRIEVAL_K**: Number of documents to retrieve (default: 8)
  - Higher = more coverage, but slower
  - Lower = faster, but may miss relevant cars

- **LLM Temperature**: 
  - Query Understanding: 0.3 (structured output)
  - RAG Generation: 0.4 (factual responses)
  - Refinement: 0.5 (natural language)

- **Chat History Length**: Last 10 exchanges (configurable in main.py)

---

## 📈 Performance Characteristics

### Typical Latency Breakdown

```
User Query → Response
├─ Query Understanding: ~500ms (LLM call)
├─ Retrieval: ~50-100ms (Qdrant search)
├─ RAG Generation: ~1-2s (LLM call with context)
├─ Refinement: ~500ms (LLM call)
└─ Enrichment: ~200-500ms (MongoDB fetches)
─────────────────────────────────────────────
Total: ~2-4 seconds (depending on LLM provider)
```

### Optimization Strategies

1. **Session Caching**: Chains cached per session to avoid recreation
2. **Batch Embedding**: Process cars in batches during initialization
3. **Payload Indexes**: Fast metadata filtering in Qdrant
4. **Selective Retrieval**: Only fetch top K most relevant cars
5. **Parallel Enrichment**: Fetch full car data in parallel (Promise.all)

---

## 🎯 Summary

This RAG pipeline combines:

1. **Semantic Search**: Vector similarity for understanding user intent
2. **Structured Filtering**: Metadata filters for precise matching
3. **LLM Understanding**: Deep query analysis with context awareness
4. **Hybrid Retrieval**: Best of both semantic and exact matching
5. **Response Enhancement**: LLM refinement for natural, helpful responses
6. **Conversation Memory**: Context-aware multi-turn conversations

The system is production-ready, scalable, and provides accurate, contextual car recommendations! 🚀

