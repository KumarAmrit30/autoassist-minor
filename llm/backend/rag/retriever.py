"""
Qdrant-backed LangChain retriever with metadata filtering support.
"""

import logging
import os
from typing import Dict, Any, Optional, List

from dotenv import load_dotenv
# Use the new langchain-qdrant package (better integration with qdrant-client 1.7+)
try:
    from langchain_qdrant import Qdrant as QdrantVectorStore
    from langchain_community.embeddings import HuggingFaceEmbeddings
    from langchain_core.retrievers import BaseRetriever
except ImportError:
    # Fallback to community package if langchain-qdrant not installed
    from langchain_community.vectorstores import Qdrant as QdrantVectorStore
    from langchain_community.embeddings import HuggingFaceEmbeddings
    from langchain_core.retrievers import BaseRetriever

from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue, Range
from qdrant_client.http.models import NearestQuery
from typing import List, Any, Optional
import logging

logger = logging.getLogger(__name__)


def _add_search_method_to_client(client: QdrantClient) -> QdrantClient:
    """
    Add 'search' method to QdrantClient instance for LangChain compatibility.
    
    This is a robust, future-proof solution that:
    1. Works with current qdrant-client 1.16+
    2. Maintains compatibility with LangChain's Qdrant integration
    3. Handles all edge cases properly
    4. Won't break with future updates (only adds method if missing)
    
    Args:
        client: QdrantClient instance to patch
        
    Returns:
        The same client instance with search method added
    """
    # Only add if it doesn't exist (future-proof)
    if hasattr(client, 'search'):
        return client
    
    def search_method(
        self,
        collection_name: str = None, 
        query_vector: List[float] = None, 
        limit: int = 10, 
        **kwargs
    ) -> Any:
        """
        Compatibility method that wraps query_points to match LangChain's expected API.
        
        This method is added to QdrantClient instances to bridge the gap between
        qdrant-client 1.16+ (which uses query_points) and LangChain's expectation
        of a 'search' method.
        """
        try:
            # Handle both positional and keyword arguments
            # LangChain may call: search(collection_name=..., query_vector=..., limit=...)
            if collection_name is None and 'collection_name' in kwargs:
                collection_name = kwargs.pop('collection_name')
            if query_vector is None and 'query_vector' in kwargs:
                query_vector = kwargs.pop('query_vector')
            
            # Ensure query_vector is a list
            if query_vector is None:
                raise ValueError("query_vector is required")
            if not isinstance(query_vector, list):
                query_vector = list(query_vector)
            
            # Create NearestQuery for vector similarity search
            # NearestQuery expects: nearest=[...] (list of floats directly)
            nearest_query = NearestQuery(nearest=query_vector)
            
            # Build query parameters
            query_params = {
                "query": nearest_query,
                "limit": limit,
                "with_payload": True,  # CRITICAL: Fetch payloads (metadata)
                "with_vectors": False   # Don't need vectors in response
            }
            
            # Add filter if provided (for metadata filtering)
            if "filter" in kwargs and kwargs["filter"] is not None:
                query_params["query_filter"] = kwargs["filter"]
            
            # Execute query using the modern query_points API
            results = client.query_points(
                collection_name=collection_name,
                **query_params
            )
            
            # LangChain expects an iterable of points directly
            # Return the points list directly (it's already iterable)
            return results.points
            
        except Exception as e:
            logger.error(f"Error in search compatibility method: {e}")
            import traceback
            logger.debug(traceback.format_exc())
            # Return empty list on error to prevent crashes (LangChain expects iterable)
            return []
    
    # Bind the method to the client instance
    import types
    client.search = types.MethodType(search_method, client)
    
    return client

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Environment variables
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", None)
QDRANT_COLLECTION_NAME = os.getenv("QDRANT_COLLECTION_NAME", "cars_rag")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
RETRIEVAL_K = int(os.getenv("RETRIEVAL_K", "8"))  # Increased from 5 to 8 for better coverage


def get_qdrant_client() -> QdrantClient:
    """
    Get Qdrant client instance with LangChain compatibility.
    
    This function returns a QdrantClient instance with the 'search' method
    added for compatibility with LangChain's Qdrant integration.
    
    Returns:
        QdrantClient instance with search method added
    """
    if QDRANT_API_KEY:
        client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    else:
        client = QdrantClient(url=QDRANT_URL)
    
    # Add search method for LangChain compatibility
    return _add_search_method_to_client(client)


def build_qdrant_filter(filters: Dict[str, Any]) -> Optional[Filter]:
    """
    Build Qdrant filter from metadata filters.
    Supports comprehensive filtering based on MongoDB car schema.
    
    Args:
        filters: Dictionary of filter conditions
            # Price filters
            - price_max: Maximum price (in lakhs)
            - price_min: Minimum price (in lakhs)
            - price_lakhs_max: Maximum price (explicit lakhs)
            - price_lakhs_min: Minimum price (explicit lakhs)
            
            # Basic filters
            - make: Car brand/manufacturer
            - body_type: Exact match for body type (SUV, Sedan, Hatchback, etc.)
            - fuel_type: Exact match for fuel type (Electric, Hybrid, Diesel, Petrol)
            - segment: Car segment (Premium, Luxury, Budget, etc.)
            
            # Year filters
            - year_min: Minimum year
            - year_max: Maximum year
            
            # Performance filters
            - mileage_min: Minimum mileage (kmpl)
            - power_bhp_min: Minimum power (bhp)
            - transmission_type: Manual, Automatic, CVT, DCT
            
            # Safety filters
            - airbags_min: Minimum number of airbags
            - abs: Has ABS (boolean)
            - esc: Has ESC (boolean)
            
            # Features
            - sunroof: Has sunroof (boolean)
            - cruise_control: Has cruise control (boolean)
            - apple_carplay: Has Apple CarPlay (boolean)
            
            # ADAS features
            - adaptive_cruise: Has adaptive cruise control (boolean)
            - lane_keep_assist: Has lane keep assist (boolean)
            
    Returns:
        Qdrant Filter object or None
    """
    if not filters:
        return None
    
    conditions = []
    
    # Price filters (support both formats)
    price_max = filters.get("price_max") or filters.get("price_lakhs_max")
    price_min = filters.get("price_min") or filters.get("price_lakhs_min")
    
    if price_max:
        conditions.append(
            FieldCondition(
                key="price_lakhs",
                range=Range(lte=float(price_max))
            )
        )
    if price_min:
        conditions.append(
            FieldCondition(
                key="price_lakhs",
                range=Range(gte=float(price_min))
            )
        )
    
    # Make/Brand filter - DISABLED
    # Note: We rely on semantic search for brand filtering instead of metadata filter
    # because Qdrant requires indexes for metadata filters, and brand names in queries
    # are better handled via semantic similarity search anyway.
    # Semantic search will find "Mahindra", "Tata", etc. in the car description text.
    
    # Body type filter
    if "body_type" in filters and filters["body_type"]:
        # Handle both single value and list
        body_type_value = filters["body_type"]
        if isinstance(body_type_value, list):
            body_type_value = body_type_value[0] if body_type_value else None
        
        if body_type_value:
            conditions.append(
                FieldCondition(
                    key="body_type",
                    match=MatchValue(value=str(body_type_value))
                )
            )
    
    # Fuel type filter
    if "fuel_type" in filters and filters["fuel_type"]:
        fuel_type_value = filters["fuel_type"]
        if isinstance(fuel_type_value, list):
            fuel_type_value = fuel_type_value[0] if fuel_type_value else None
        
        if fuel_type_value:
            conditions.append(
                FieldCondition(
                    key="fuel_type",
                    match=MatchValue(value=str(fuel_type_value))
                )
            )
    
    # Segment filter
    if "segment" in filters and filters["segment"]:
        segment_value = filters["segment"]
        if isinstance(segment_value, list):
            segment_value = segment_value[0] if segment_value else None
        
        if segment_value:
            conditions.append(
                FieldCondition(
                    key="segment",
                    match=MatchValue(value=str(segment_value))
                )
            )
    
    # Year filters
    if "year_min" in filters:
        conditions.append(
            FieldCondition(
                key="year",
                range=Range(gte=int(filters["year_min"]))
            )
        )
    if "year_max" in filters:
        conditions.append(
            FieldCondition(
                key="year",
                range=Range(lte=int(filters["year_max"]))
            )
        )
    
    # Mileage filter
    if "mileage_min" in filters:
        conditions.append(
            FieldCondition(
                key="mileage",
                range=Range(gte=float(filters["mileage_min"]))
            )
        )
    
    # Power filter
    if "power_bhp_min" in filters:
        conditions.append(
            FieldCondition(
                key="power_bhp",
                range=Range(gte=float(filters["power_bhp_min"]))
            )
        )
    
    # Transmission type filter
    if "transmission_type" in filters and filters["transmission_type"]:
        transmission_value = filters["transmission_type"]
        if isinstance(transmission_value, list):
            transmission_value = transmission_value[0] if transmission_value else None
        
        if transmission_value:
            conditions.append(
                FieldCondition(
                    key="transmission_type",
                    match=MatchValue(value=str(transmission_value))
                )
            )
    
    # Safety filters
    if "airbags_min" in filters:
        conditions.append(
            FieldCondition(
                key="airbags",
                range=Range(gte=int(filters["airbags_min"]))
            )
        )
    
    # Boolean feature filters
    bool_filters = {
        "abs": "abs",
        "esc": "esc",
        "sunroof": "sunroof",
        "cruise_control": "cruise_control",
        "apple_carplay": "apple_carplay",
        "adaptive_cruise": "adaptive_cruise",
        "lane_keep_assist": "lane_keep_assist",
        "parking_camera": "parking_camera",
        "keyless_entry": "keyless_entry",
        "connected_tech": "connected_tech",
    }
    
    for filter_key, field_key in bool_filters.items():
        if filter_key in filters and filters[filter_key]:
            conditions.append(
                FieldCondition(
                    key=field_key,
                    match=MatchValue(value=True)
                )
            )
    
    if not conditions:
        return None
    
    # Combine all conditions with AND
    return Filter(must=conditions)


def get_retriever(filters: Optional[Dict[str, Any]] = None, k: int = None) -> BaseRetriever:
    """
    Get Qdrant retriever with optional metadata filters.
    Uses custom implementation to properly extract all payload fields as metadata.
    
    Args:
        filters: Dictionary of metadata filters
        k: Number of documents to retrieve (defaults to RETRIEVAL_K env var)
        
    Returns:
        Custom Qdrant retriever instance
    """
    if k is None:
        k = RETRIEVAL_K
    
    logger.info(f"Creating custom retriever with k={k}, filters={filters}")
    
    # Initialize embeddings
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    
    # Get Qdrant client
    client = get_qdrant_client()
    
    # Build filter
    qdrant_filter = build_qdrant_filter(filters) if filters else None
    
    # Create custom retriever
    retriever = CustomQdrantRetriever(
        client=client,
        collection_name=QDRANT_COLLECTION_NAME,
        embeddings=embeddings,
        k=k,
        qdrant_filter=qdrant_filter
    )
    
    logger.info("Custom retriever created successfully")
    return retriever


class CustomQdrantRetriever(BaseRetriever):
    """
    Custom Qdrant retriever that properly extracts ALL payload fields as metadata.
    This bypasses LangChain's Qdrant integration issues.
    """
    client: Any
    collection_name: str
    embeddings: Any
    k: int = 5
    qdrant_filter: Optional[Any] = None
    
    class Config:
        arbitrary_types_allowed = True
    
    def _get_relevant_documents(self, query: str) -> List[Any]:
        """Retrieve documents from Qdrant with full metadata."""
        from langchain_core.documents import Document
        from qdrant_client.models import NearestQuery
        
        # Generate query embedding
        query_embedding = self.embeddings.embed_query(query)
        
        # Build query params
        query_params = {
            "query": NearestQuery(nearest=query_embedding),
            "limit": self.k,
            "with_payload": True,
            "with_vectors": False
        }
        
        if self.qdrant_filter:
            query_params["query_filter"] = self.qdrant_filter
        
        # Query Qdrant with error handling for missing indexes
        try:
            results = self.client.query_points(
                collection_name=self.collection_name,
                **query_params
            )
        except Exception as e:
            error_msg = str(e)
            # If filter fails due to missing index, retry without filter
            if "Index required" in error_msg or "not found" in error_msg.lower():
                logger.warning(f"Filter failed due to missing index: {error_msg}")
                logger.info("Retrying query without filters...")
                
                # Retry without filter
                query_params_no_filter = {
                    "query": NearestQuery(nearest=query_embedding),
                    "limit": self.k,
                    "with_payload": True,
                    "with_vectors": False
                }
                results = self.client.query_points(
                    collection_name=self.collection_name,
                    **query_params_no_filter
                )
            else:
                # Re-raise if it's a different error
                raise
        
        # Convert to LangChain Documents with FULL payload as metadata
        documents = []
        for point in results.points:
            # Extract page_content from payload
            page_content = point.payload.get("page_content", point.payload.get("description", ""))
            
            # ALL other payload fields become metadata
            metadata = {k: v for k, v in point.payload.items() if k != "page_content"}
            
            # Create Document
            doc = Document(
                page_content=page_content,
                metadata=metadata
            )
            documents.append(doc)
        
        logger.info(f"Retrieved {len(documents)} documents from Qdrant")
        if documents:
            logger.debug(f"Sample metadata keys: {list(documents[0].metadata.keys())[:10]}")
        
        return documents
    
    async def _aget_relevant_documents(self, query: str) -> List[Any]:
        """Async version - just calls sync for now."""
        return self._get_relevant_documents(query)

