"""
Query parser to extract structured filters from natural language queries.
Uses LLM to understand user intent and extract constraints.
"""

import logging
import json
from typing import Dict, Any, Optional
from backend.rag.model import get_llm

logger = logging.getLogger(__name__)

# Template for extracting filters from queries
FILTER_EXTRACTION_PROMPT = """You are a query analyzer for a car recommendation system. Extract structured filters from the user's query.

User Query: "{query}"

Extract the following information if mentioned:
- price_max: Maximum price in lakhs (float)
- price_min: Minimum price in lakhs (float)
- body_type: Body type (Hatchback, Sedan, SUV, MUV, Coupe, Convertible, Pickup Truck, Micro SUV)
- fuel_type: Fuel type (Petrol, Diesel, Electric, Hybrid, CNG)
- segment: Segment (Mini, A-Segment, B-Segment, C-Segment, D-Segment, Luxury, SUV, etc)
- mileage_min: Minimum mileage in kmpl (float)
- seating_capacity: Number of seats (5, 7, 8)
- transmission_type: Transmission (Manual, Automatic, AMT, CVT, DCT)
- year_min: Minimum year (int)

Important rules:
- "under X lakhs" means price_max = X
- "above X lakhs" means price_min = X
- "between X and Y lakhs" means price_min = X, price_max = Y
- "fuel efficient" means mileage_min = 18
- "very fuel efficient" or "high mileage" means mileage_min = 22
- "family car" typically means seating_capacity = 7 or body_type = SUV/MUV
- "city car" typically means body_type = Hatchback
- "luxury" means segment = Luxury

Respond ONLY with a valid JSON object. If a filter is not mentioned, omit it. Empty object {} if no filters.

Example 1:
Query: "SUV under 15 lakhs"
Response: {{"body_type": "SUV", "price_max": 15.0}}

Example 2:
Query: "fuel efficient sedan"
Response: {{"body_type": "Sedan", "mileage_min": 18.0}}

Example 3:
Query: "electric car for family"
Response: {{"fuel_type": "Electric", "seating_capacity": 7}}

Now extract filters from the user query above. Respond with ONLY the JSON object:"""


def extract_filters_from_query(query: str) -> Dict[str, Any]:
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
        
        # Create prompt - use replace() instead of format() to avoid issues with JSON braces
        prompt = FILTER_EXTRACTION_PROMPT.replace("{query}", query)
        
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

