"""
Advanced query understanding using Gemini/Groq to better interpret user intent.
This pre-processing step helps RAG perform better searches.
"""

import logging
import os
import json
from typing import Dict, Any, List, Tuple
from dotenv import load_dotenv

logger = logging.getLogger(__name__)
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", None)
GROQ_API_KEY = os.getenv("GROQ_API_KEY", None)

QUERY_UNDERSTANDING_PROMPT = """You are an expert at understanding car-related queries in India. Analyze the user's query and conversation history to provide a comprehensive understanding.

## Previous Conversation:
{chat_history}

## Current Query:
"{current_query}"

## Your Task:
Analyze the query considering the conversation context and provide:

1. **Combined Intent**: What is the user really looking for? (combine current query with previous context)
2. **Extracted Filters**: Structured filters (JSON format)
3. **Search Keywords**: Best keywords for semantic search
4. **Missing Context**: What additional info would be helpful

## Output Format (JSON):
{{
  "combined_intent": "Clear description of what user wants based on full conversation",
  "filters": {{
    "price_max": 25.0,
    "body_type": "SUV",
    "seating_capacity": 7
  }},
  "search_keywords": "fuel efficient 7 seater family SUV",
  "context_notes": "User mentioned budget earlier, now specifying body type"
}}

## Examples:

### Example 1:
Previous: "I want a car under 10 lakhs"
Current: "fuel efficient SUV"
Output:
{{
  "combined_intent": "User wants a fuel-efficient SUV under ₹10 lakhs",
  "filters": {{"price_max": 10.0, "body_type": "SUV", "mileage_min": 18.0}},
  "search_keywords": "fuel efficient SUV",
  "context_notes": "Combined price from previous query with current SUV requirement"
}}

### Example 2:
Previous: "25 lakh ke andar ki family car batao"
Current: "haan aur batao"
Output:
{{
  "combined_intent": "User wants more family car options under ₹25 lakhs",
  "filters": {{"price_max": 25.0, "seating_capacity": 7}},
  "search_keywords": "family car spacious",
  "context_notes": "Follow-up query - maintaining same criteria from previous message"
}}

### Example 3:
Previous: "fuel efficient sedan"
Current: "any other from Maruti?"
Output:
{{
  "combined_intent": "User wants fuel-efficient sedans from Maruti Suzuki brand",
  "filters": {{"body_type": "Sedan", "mileage_min": 18.0}},
  "search_keywords": "Maruti Suzuki fuel efficient sedan",
  "context_notes": "Adding brand name to search keywords (not filter) for previous sedan query"
}}

### Example 4:
Previous: None
Current: "top 10 cars in India"
Output:
{{
  "combined_intent": "User wants to see popular/best-selling cars in India across segments",
  "filters": {{}},
  "search_keywords": "popular cars India best sellers",
  "context_notes": "Broad query - should show diverse popular models"
}}

## Rules:
- If current query is vague ("tell me more", "aur batao"), USE filters from previous query
- If previous query mentioned price/budget, CARRY IT FORWARD unless explicitly changed
- For Hindi/Hinglish ("25 lakh ke andar"), extract the same filters as English equivalent
- "family car" usually means 7-seater OR SUV/MUV body type
- "fuel efficient" means mileage_min: 18.0 (or 22.0 for "very fuel efficient")
- **Brand names (Mahindra, Tata, Maruti, etc.) should go in "search_keywords", NOT in filters**
- Do NOT use "make" filter - include brand name in search_keywords instead (e.g., "Mahindra cars", "Tata SUVs")

Now analyze the query above and respond with ONLY the JSON object:"""


def understand_query_with_llm(
    current_query: str,
    chat_history: List[Tuple[str, str]] = None
) -> Dict[str, Any]:
    """
    Use Gemini/Groq to deeply understand user query in context.
    
    Args:
        current_query: User's current query
        chat_history: Previous conversation
        
    Returns:
        Dictionary with combined_intent, filters, search_keywords, context_notes
    """
    try:
        # Format chat history
        history_str = "No previous conversation"
        if chat_history and len(chat_history) > 0:
            history_lines = []
            for q, a in chat_history[-3:]:  # Last 3 exchanges
                history_lines.append(f"User: {q}")
                # Include brief context from AI response
                if "lakhs" in a:
                    # Extract price mentions
                    import re
                    prices = re.findall(r'₹(\d+(?:\.\d+)?)\s*lakhs?', a)
                    if prices:
                        history_lines.append(f"Assistant: [Recommended cars at ₹{prices[0]} lakhs]")
                else:
                    history_lines.append(f"Assistant: {a[:100]}...")
            history_str = "\n".join(history_lines)
        
        # Build prompt
        prompt = QUERY_UNDERSTANDING_PROMPT.format(
            chat_history=history_str,
            current_query=current_query
        )
        
        # Call Groq or Gemini (prefer Groq for speed)
        if GROQ_API_KEY:
            from groq import Groq
            client = Groq(api_key=GROQ_API_KEY)
            
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",  # Updated model (3.1 decommissioned)
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=1024,
            )
            result_text = response.choices[0].message.content
            logger.info("✅ Query understood using Groq")
        elif GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=GEMINI_API_KEY)
                model = genai.GenerativeModel('gemini-pro')
                
                response = model.generate_content(
                    prompt,
                    generation_config={
                        "temperature": 0.3,  # Lower for more structured output
                        "top_p": 0.95,
                        "max_output_tokens": 1024,
                    }
                )
                result_text = response.text
                logger.info("✅ Query understood using Gemini")
            except Exception as e:
                logger.warning(f"Gemini failed: {e}")
                raise
        else:
            logger.warning("⚠️ No LLM for query understanding - using fallback")
            return {
                "combined_intent": current_query,
                "filters": {},
                "search_keywords": current_query,
                "context_notes": "No LLM available for query understanding"
            }
        
        # Parse JSON response
        result_text = result_text.strip()
        start_idx = result_text.find('{')
        end_idx = result_text.rfind('}')
        
        if start_idx == -1 or end_idx == -1:
            logger.warning(f"No JSON in response: {result_text}")
            return {
                "combined_intent": current_query,
                "filters": {},
                "search_keywords": current_query,
                "context_notes": "Failed to parse LLM response"
            }
        
        json_str = result_text[start_idx:end_idx+1]
        understanding = json.loads(json_str)
        
        logger.info(f"📊 Query Understanding:")
        logger.info(f"   Intent: {understanding.get('combined_intent', 'N/A')}")
        logger.info(f"   Filters: {understanding.get('filters', {})}")
        logger.info(f"   Keywords: {understanding.get('search_keywords', 'N/A')}")
        
        return understanding
        
    except Exception as e:
        logger.error(f"Error understanding query: {e}")
        # Return basic fallback
        return {
            "combined_intent": current_query,
            "filters": {},
            "search_keywords": current_query,
            "context_notes": f"Error: {str(e)}"
        }

