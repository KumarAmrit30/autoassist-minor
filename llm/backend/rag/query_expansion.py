"""
Query expansion and rewriting for improved RAG retrieval.
Expands user queries with synonyms, related terms, and context-aware variations.
"""

import logging
from typing import List, Dict, Any, Tuple
from backend.rag.model import get_llm

logger = logging.getLogger(__name__)

# Query expansion prompt
QUERY_EXPANSION_PROMPT = """You are a query expansion expert for a car recommendation system in India. Your task is to expand and rewrite user queries to improve semantic search results.

## Original Query:
"{original_query}"

## Previous Conversation Context:
{chat_history}

## Your Task:
Generate 2-3 expanded/rewritten versions of the query that:
1. Include synonyms and related terms
2. Add context from previous conversation if query is vague
3. Include alternative phrasings that users might use
4. Preserve the core intent while adding semantic richness

## Examples:

### Example 1:
Original: "fuel efficient SUV"
Expansions:
- "fuel efficient SUV high mileage"
- "economical SUV good fuel economy"
- "SUV with excellent mileage fuel efficient"

### Example 2:
Previous: "SUV under 15 lakhs"
Current: "haan aur batao"
Expansions:
- "SUV under 15 lakhs affordable"
- "budget SUV under 15 lakhs"
- "SUV options under 15 lakhs"

### Example 3:
Original: "family car"
Expansions:
- "family car 7 seater spacious"
- "family car comfortable seating"
- "family car large interior"

## Output Format (JSON):
{{
  "expanded_queries": [
    "expanded query 1",
    "expanded query 2",
    "expanded query 3"
  ],
  "primary_query": "best single query to use for search"
}}

Now expand the query above and respond with ONLY the JSON object:"""


def expand_query(
    original_query: str,
    chat_history: List[Tuple[str, str]] = None
) -> List[str]:
    """
    Expand user query with synonyms and context-aware variations.
    
    Args:
        original_query: Original user query
        chat_history: Previous conversation
        
    Returns:
        List of expanded query variations
    """
    try:
        # Format chat history
        history_str = "No previous conversation"
        if chat_history and len(chat_history) > 0:
            history_lines = []
            for q, a in chat_history[-3:]:  # Last 3 exchanges
                history_lines.append(f"User: {q}")
                history_lines.append(f"Assistant: {a[:150]}...")
            history_str = "\n".join(history_lines)
        
        # Build prompt
        prompt = QUERY_EXPANSION_PROMPT.format(
            original_query=original_query,
            chat_history=history_str
        )
        
        # Get LLM
        llm = get_llm()
        
        # Get expansion
        response = llm.invoke(prompt)
        
        # Parse JSON response
        import json
        response_text = response.strip()
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}')
        
        if start_idx == -1 or end_idx == -1:
            logger.warning(f"No JSON in expansion response: {response_text}")
            return [original_query]  # Fallback to original
        
        json_str = response_text[start_idx:end_idx+1]
        expansion = json.loads(json_str)
        
        expanded_queries = expansion.get("expanded_queries", [original_query])
        primary_query = expansion.get("primary_query", original_query)
        
        # Combine primary with expansions, removing duplicates
        all_queries = [primary_query] + expanded_queries
        unique_queries = []
        seen = set()
        for q in all_queries:
            q_lower = q.lower().strip()
            if q_lower and q_lower not in seen:
                seen.add(q_lower)
                unique_queries.append(q)
        
        logger.info(f"Query expanded: '{original_query}' -> {len(unique_queries)} variations")
        return unique_queries[:3]  # Return top 3 variations
        
    except Exception as e:
        logger.error(f"Error expanding query: {e}")
        return [original_query]  # Fallback to original


def get_best_expanded_query(
    original_query: str,
    chat_history: List[Tuple[str, str]] = None
) -> str:
    """
    Get the best expanded query for retrieval.
    
    Args:
        original_query: Original user query
        chat_history: Previous conversation
        
    Returns:
        Best expanded query string
    """
    expanded = expand_query(original_query, chat_history)
    return expanded[0] if expanded else original_query

