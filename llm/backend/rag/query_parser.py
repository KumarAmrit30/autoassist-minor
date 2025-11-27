"""
Query parser to extract structured filters from natural language queries.
Uses LLM to understand user intent and extract constraints.
"""

import logging
import json
from typing import Dict, Any, Optional, List
from backend.rag.model import get_llm

logger = logging.getLogger(__name__)

# Template for extracting filters from queries
FILTER_EXTRACTION_PROMPT = """You are a precise query analyzer for a car recommendation system in India. Extract structured filters from the user's natural language query.

User Query: "{query}"

## Your Task:
Extract ONLY the filters that are explicitly mentioned or strongly implied in the query. Be conservative - only extract what is clear.

## Available Filters (extract if mentioned):
- price_max: Maximum price in lakhs (float) - e.g., 15.0 for "under 15 lakhs"
- price_min: Minimum price in lakhs (float) - e.g., 10.0 for "above 10 lakhs"
- body_type: One of: Hatchback, Sedan, SUV, MUV, Coupe, Convertible, Pickup Truck, Micro SUV
- fuel_type: One of: Petrol, Diesel, Electric, Hybrid, CNG
- segment: One of: Mini, A-Segment, B-Segment, C-Segment, D-Segment, Luxury, Premium, Budget
- mileage_min: Minimum mileage in kmpl (float)
- seating_capacity: Number of seats - typically 5, 7, or 8
- transmission_type: One of: Manual, Automatic, AMT, CVT, DCT
- year_min: Minimum manufacturing year (integer)

## Interpretation Rules:
**Price:**
- "under ₹X", "below ₹X", "less than ₹X" → price_max = X
- "above ₹X", "over ₹X", "more than ₹X" → price_min = X
- "between ₹X and ₹Y" → price_min = X, price_max = Y
- "around ₹X" → price_min = X*0.9, price_max = X*1.1 (approximate)

**Fuel Efficiency:**
- "fuel efficient", "good mileage" → mileage_min = 18.0
- "very fuel efficient", "high mileage", "best mileage" → mileage_min = 22.0
- "economical" → mileage_min = 20.0

**Body Type & Use Cases:**
- "family car", "7 seater", "family SUV" → seating_capacity = 7 OR body_type = SUV/MUV
- "city car", "compact car" → body_type = Hatchback
- "luxury car", "premium car" → segment = Luxury
- "budget car", "affordable" → segment = Budget (if price not specified)

**Fuel Type:**
- "electric", "EV" → fuel_type = Electric
- "hybrid" → fuel_type = Hybrid
- "petrol", "diesel" → fuel_type = Petrol/Diesel

**Transmission:**
- "automatic", "auto" → transmission_type = Automatic
- "manual" → transmission_type = Manual

## Output Format:
Respond with ONLY a valid JSON object. If no filters are mentioned, return {{}}.

## Examples:

Query: "SUV under 15 lakhs"
Response: {{"body_type": "SUV", "price_max": 15.0}}

Query: "fuel efficient sedan"
Response: {{"body_type": "Sedan", "mileage_min": 18.0}}

Query: "electric car for family"
Response: {{"fuel_type": "Electric", "seating_capacity": 7}}

Query: "luxury sedan above 30 lakhs with automatic transmission"
Response: {{"segment": "Luxury", "body_type": "Sedan", "price_min": 30.0, "transmission_type": "Automatic"}}

Query: "best fuel efficient cars under 12 lakhs"
Response: {{"price_max": 12.0, "mileage_min": 22.0}}

## SPECIAL CASES (when there's chat history):

Previous: "SUV under 15 lakhs"
Current: "Tell me more" OR "aur batao"
Response: {{"body_type": "SUV", "price_max": 15.0}}

Previous: "fuel efficient sedan"
Current: "any other from Maruti?"
Response: {{"body_type": "Sedan", "mileage_min": 18.0, "make": "Maruti_Suzuki"}}

Previous: "family car under 25 lakhs"
Current: "haan aur batao"
Response: {{"seating_capacity": 7, "price_max": 25.0}}

Now extract filters from: "{query}"
Respond with ONLY the JSON object (no explanation):"""


def extract_filters_from_query(query: str, chat_history: List = None) -> Dict[str, Any]:
    """
    Use LLM to extract structured filters from natural language query.
    
    Args:
        query: User's natural language query
        
    Returns:
        Dictionary of extracted filters
    """
    try:
        # Get LLM
        llm = get_llm()
        
        # Add chat history context if available
        history_context = ""
        if chat_history and len(chat_history) > 0:
            # Get last 3 exchanges for context
            recent_history = chat_history[-3:] if len(chat_history) > 3 else chat_history
            history_lines = []
            for human_query, ai_response in recent_history:
                history_lines.append(f"Previous query: {human_query}")
            history_context = "\n".join(history_lines)
            history_context = f"""
Previous conversation context:
{history_context}

IMPORTANT: 
- If current query is vague ("tell me more", "aur batao", "any other?"), extract filters from the MOST RECENT previous query
- If current query says "from [brand]", add that brand to existing filters
- If current query says "remember the [X]", look for that X in previous queries
- If current query has new specific filters, UPDATE/ADD to previous filters (don't replace completely)

Consider the context above when extracting filters:
"""
        
        # Create prompt - use replace() instead of format() to avoid issues with JSON braces
        prompt = FILTER_EXTRACTION_PROMPT.replace("{query}", query)
        if history_context:
            prompt = history_context + prompt
        
        # Get LLM response
        response = llm.invoke(prompt)
        
        # Parse JSON response
        # Try to extract JSON from response (LLM might add extra text)
        response_text = response.strip()
        
        # Find JSON object in response
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}')
        
        if start_idx == -1 or end_idx == -1:
            logger.warning(f"No JSON found in LLM response: {response_text}")
            return {}
        
        json_str = response_text[start_idx:end_idx+1]
        filters = json.loads(json_str)
        
        logger.info(f"Extracted filters from query '{query}': {filters}")
        return filters
        
    except Exception as e:
        logger.error(f"Error extracting filters from query: {e}")
        return {}


def merge_filters(auto_filters: Dict[str, Any], manual_filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Merge automatically extracted filters with manually provided filters.
    Manual filters take precedence.
    
    Args:
        auto_filters: Filters extracted from query
        manual_filters: Filters explicitly provided by user/API
        
    Returns:
        Merged filters dictionary
    """
    if not manual_filters:
        return auto_filters
    
    # Start with auto filters
    merged = auto_filters.copy()
    
    # Override with manual filters
    merged.update(manual_filters)
    
    return merged


def optimize_query_for_search(query: str, filters: Dict[str, Any]) -> str:
    """
    Optimize the query string for semantic search by removing filter-related terms.
    This helps focus the semantic search on the intent rather than constraints.
    
    Args:
        query: Original user query
        filters: Extracted filters
        
    Returns:
        Optimized query string for semantic search
    """
    # Remove common filter phrases that don't help semantic search
    remove_phrases = [
        "under", "above", "below", "between",
        "lakhs", "lakh", "rupees", "₹",
        "minimum", "maximum", "max", "min",
        "at least", "no more than",
    ]
    
    optimized = query.lower()
    
    for phrase in remove_phrases:
        optimized = optimized.replace(phrase, " ")
    
    # Remove numbers that are likely prices
    import re
    optimized = re.sub(r'\b\d+\.?\d*\s*(lakh|lakhs|l)\b', '', optimized, flags=re.IGNORECASE)
    
    # Clean up extra whitespace
    optimized = " ".join(optimized.split())
    
    logger.debug(f"Optimized query: '{query}' -> '{optimized}'")
    
    return optimized if optimized.strip() else query

