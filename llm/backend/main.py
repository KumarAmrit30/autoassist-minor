"""
FastAPI application for car recommendations RAG chatbot.
"""

import logging
from typing import Optional, Dict, Any, List, Tuple
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from backend.rag.chain import create_chain, query_chain
from backend.rag.query_parser import extract_filters_from_query, optimize_query_for_search
from backend.rag.refiner import refine_response_with_llm
from backend.rag.query_understanding import understand_query_with_llm
from backend.rag.query_expansion import get_best_expanded_query

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Car Recommendations RAG Chatbot",
    description="RAG-based chatbot for car recommendations",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store chains and chat history per session (in production, use Redis or similar)
session_chains: Dict[str, Any] = {}
session_histories: Dict[str, List] = {}

# Gemini refinement LLM (separate from RAG retrieval LLM)
refinement_llm = None


class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    query: str
    filters: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    """Response model for chat endpoint."""
    answer: str
    recommended: List[Dict[str, Any]]
    sources: List[Dict[str, Any]]


def get_or_create_chain(session_id: str, filters: Optional[Dict[str, Any]] = None):
    """
    Get or create chain for a session.
    
    Args:
        session_id: Session identifier
        filters: Metadata filters
        
    Returns:
        ConversationalRetrievalChain instance
    """
    # Create a key based on session_id and filters
    chain_key = f"{session_id}_{hash(str(filters))}"
    
    if chain_key not in session_chains:
        logger.info(f"Creating new chain for session: {session_id}")
        chain = create_chain(filters=filters)
        session_chains[chain_key] = chain
    else:
        logger.info(f"Using existing chain for session: {session_id}")
        chain = session_chains[chain_key]
    
    return chain


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Car Recommendations RAG Chatbot API",
        "version": "1.0.0",
        "endpoints": {
            "/chat": "POST - Chat endpoint for car recommendations",
            "/health": "GET - Health check"
        }
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat endpoint for car recommendations with intelligent filter extraction.
    
    Args:
        request: Chat request with query, filters, and session_id
        
    Returns:
        Chat response with answer, recommended cars, and sources
    """
    try:
        logger.info(f"Received chat request: query='{request.query}', filters={request.filters}, session_id={request.session_id}")
        
        # Generate session ID if not provided (do this first!)
        session_id = request.session_id or "default"
        
        # Get chat history for this session
        chat_history = session_histories.get(session_id, [])
        logger.info(f"Session: {session_id}, Chat history length: {len(chat_history)}")
        if chat_history:
            logger.info(f"Last exchange: Q='{chat_history[-1][0][:50]}...' A='{chat_history[-1][1][:50]}...'")
        
        # Step 1: Use Gemini to deeply understand the query with context
        logger.info("🧠 Understanding query with Gemini/Groq...")
        query_understanding = understand_query_with_llm(request.query, chat_history=chat_history)
        
        # Extract filters from understanding
        auto_filters = query_understanding.get("filters", {})
        search_keywords = query_understanding.get("search_keywords", request.query)
        combined_intent = query_understanding.get("combined_intent", request.query)
        
        logger.info(f"Combined Intent: {combined_intent}")
        logger.info(f"Search Keywords: {search_keywords}")
        
        # Step 2: Merge with explicit filters (explicit takes precedence)
        final_filters = auto_filters.copy()
        if request.filters:
            final_filters.update(request.filters)
        
        logger.info(f"Auto-extracted filters: {auto_filters}")
        logger.info(f"Final filters (merged): {final_filters}")
        
        # Step 3: Expand query for better retrieval (optional enhancement)
        # Use the search keywords from understanding, but can expand further if needed
        optimized_query = search_keywords  # Use keywords from Gemini understanding
        
        # For vague queries, try query expansion to improve retrieval
        if any(phrase in request.query.lower() for phrase in ["aur batao", "tell me more", "any other", "haan"]):
            logger.info("🔍 Expanding vague query for better retrieval...")
            expanded_query = get_best_expanded_query(search_keywords, chat_history=chat_history)
            if expanded_query and expanded_query != search_keywords:
                optimized_query = expanded_query
                logger.info(f"Query expanded: '{search_keywords}' -> '{optimized_query}'")
        
        logger.info(f"Final optimized query: '{request.query}' -> '{optimized_query}'")
        
        # Get or create chain with filters
        chain = get_or_create_chain(session_id, final_filters)
        
        # Query chain with optimized query and chat history
        result = query_chain(chain, optimized_query, chat_history=chat_history)
        
        logger.info(f"✅ RAG retrieved {len(result['recommended'])} unique car models")
        
        # ENHANCEMENT: Refine response using Gemini/Groq with general automotive knowledge
        logger.info("🔧 Refining response with Gemini/Groq...")
        refined_answer = refine_response_with_llm(
            original_query=request.query,
            rag_response=result["answer"],
            recommended_cars=result["recommended"],
            chat_history=chat_history
        )
        
        # Update chat history with refined answer
        session_histories[session_id] = chat_history + [(request.query, refined_answer)]
        # Keep only last 10 exchanges
        if len(session_histories[session_id]) > 10:
            session_histories[session_id] = session_histories[session_id][-10:]
        
        logger.info(f"✅ Response refined and enhanced")
        logger.info(f"✅ Session {session_id} now has {len(session_histories[session_id])} message pairs in history")
        
        return ChatResponse(
            answer=refined_answer,  # Use refined answer instead of original
            recommended=result["recommended"],
            sources=result["sources"]
        )
        
    except Exception as e:
        logger.error(f"Error processing chat request: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

