"""
Response refinement using Gemini/Groq to enhance RAG outputs.
This layer uses general automotive knowledge to supplement database-only responses.
"""

import logging
import os
from typing import Dict, Any, List, Tuple
from dotenv import load_dotenv

logger = logging.getLogger(__name__)
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", None)
GROQ_API_KEY = os.getenv("GROQ_API_KEY", None)

# Refinement prompt template
REFINEMENT_PROMPT = """You are an expert car consultant in India with deep knowledge of the automotive market. 

The user asked: "{original_query}"

Previous conversation context:
{chat_history}

## Retrieved Data from Database:
{rag_response}

Retrieved Cars:
{recommended_cars}

## Your Task:
Enhance the response above with your automotive expertise. Make it:
1. **More natural and conversational** - sound like a knowledgeable friend
2. **Context-aware** - reference previous conversation naturally
3. **Supplement with knowledge** - if database results are limited, use your general knowledge of:
   - Popular car models in India (Maruti Swift, Tata Nexon, Hyundai Creta, etc.)
   - Typical features in price segments
   - Market trends and common choices
4. **Better structured** - organize information clearly
5. **Action-oriented** - help user make a decision

## Guidelines:

**Use the database cars as primary source**, but supplement with:
- General information about car segments/types if database is limited
- Typical features expected at certain price points
- Popular alternatives if user asks for "top 10" or broad queries
- Context from previous conversation

**Format:**
- Use simple bullets (•)
- NO markdown syntax (###, **, etc.)
- Keep paragraphs short
- Natural, flowing language

**For "top 10" type queries:**
- If database has limited options, mention popular models generally (Swift, Nexon, Creta, etc.) 
- Explain you're showing available options from database
- Be transparent about what you can/can't provide

**Remember:**
- Reference previous price ranges/preferences mentioned
- Handle Hindi/Hinglish naturally ("haan aur batao" = "tell me more in same context")
- Never say "I don't recall" if it's in chat history

Now provide an enhanced, natural response:"""


def get_refinement_llm():
    """Get LLM for response refinement (uses Groq for speed and reliability)."""
    # Try Groq first (faster, more reliable for production)
    if GROQ_API_KEY:
        try:
            from groq import Groq
            logger.info("✅ Using Groq for response refinement")
            return Groq(api_key=GROQ_API_KEY)
        except Exception as e:
            logger.warning(f"Failed to initialize Groq: {e}")
    
    # Fallback to Gemini if Groq unavailable
    if GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_API_KEY)
            logger.info("✅ Using Gemini for response refinement")
            return genai.GenerativeModel('gemini-pro')
        except Exception as e:
            logger.warning(f"Failed to initialize Gemini: {e}")
    
    logger.warning("⚠️  No refinement LLM available - using original RAG response")
    return None


def refine_response_with_llm(
    original_query: str,
    rag_response: str,
    recommended_cars: List[Dict[str, Any]],
    chat_history: List[Tuple[str, str]] = None
) -> str:
    """
    Use Gemini/Groq to refine the RAG response with general automotive knowledge.
    
    Args:
        original_query: User's original query
        rag_response: Response from RAG system
        recommended_cars: List of recommended cars from RAG
        chat_history: Previous conversation
        
    Returns:
        Refined, enhanced response
    """
    try:
        llm = get_refinement_llm()
        if not llm:
            # No refinement LLM available, return original
            return rag_response
        
        # Format chat history
        history_str = ""
        if chat_history and len(chat_history) > 0:
            history_lines = []
            for q, a in chat_history[-3:]:  # Last 3 exchanges
                history_lines.append(f"User: {q}")
                history_lines.append(f"Assistant: {a[:200]}...")  # Truncate long responses
            history_str = "\n".join(history_lines)
        else:
            history_str = "No previous conversation"
        
        # Format recommended cars
        cars_str = ""
        for i, car in enumerate(recommended_cars[:5], 1):  # Top 5
            cars_str += f"{i}. {car.get('name', 'Unknown')} - ₹{car.get('price', 0):.2f}L, {car.get('mileage', 0)} kmpl\n"
        
        # Build refinement prompt
        prompt = REFINEMENT_PROMPT.format(
            original_query=original_query,
            chat_history=history_str,
            rag_response=rag_response,
            recommended_cars=cars_str or "No specific cars retrieved"
        )
        
        # Call LLM for refinement
        if hasattr(llm, 'chat'):  # Groq
            response = llm.chat.completions.create(
                model="llama-3.3-70b-versatile",  # Updated model (3.1 decommissioned)
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                max_tokens=2048,
            )
            refined = response.choices[0].message.content
        elif hasattr(llm, 'generate_content'):  # Gemini
            response = llm.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.5,  # Slightly higher for more natural language
                    "top_p": 0.95,
                    "max_output_tokens": 2048,
                }
            )
            refined = response.text
        else:
            logger.error(f"Unknown LLM type: {type(llm)}")
            return rag_response
        
        logger.info(f"✅ Response refined using {type(llm).__name__}")
        return refined.strip()
        
    except Exception as e:
        logger.error(f"Error refining response: {e}")
        # Return original on error
        return rag_response

