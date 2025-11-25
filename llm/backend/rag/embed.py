"""
Embedding generation and Qdrant vector database operations.
Computes embeddings using SentenceTransformers and upserts to Qdrant.
Supports both MongoDB and local file data sources.
"""

import argparse
import json
import logging
import os
from pathlib import Path
from typing import List, Dict, Any, Optional

from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Project root directory
PROJECT_ROOT = Path(__file__).parent.parent.parent
DATA_DIR = PROJECT_ROOT / "backend" / "data" / "processed"

# Environment variables
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", None)
QDRANT_COLLECTION_NAME = os.getenv("QDRANT_COLLECTION_NAME", "cars_rag")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
USE_MONGODB = os.getenv("USE_MONGODB", "true").lower() == "true"


def create_text_from_record(record: Dict[str, Any]) -> str:
    """
    Create a searchable text representation from a car record.
    
    Args:
        record: Car record dictionary
        
    Returns:
        Concatenated text string for embedding
    """
    # If description exists (from MongoDB loader), use it as primary content
    if "description" in record and record["description"]:
        return record["description"]
    
    # Otherwise, build description from fields
    text_parts = []
    
    if "make" in record:
        text_parts.append(f"Make: {record['make']}")
    if "model" in record:
        text_parts.append(f"Model: {record['model']}")
    if "body_type" in record:
        text_parts.append(f"Body type: {record['body_type']}")
    if "fuel_type" in record:
        text_parts.append(f"Fuel type: {record['fuel_type']}")
    if "year" in record:
        text_parts.append(f"Year: {record['year']}")
    if "price" in record:
        text_parts.append(f"Price: ${record['price']}")
    if "price_lakhs" in record:
        text_parts.append(f"Price: ₹{record['price_lakhs']} lakhs")
    if "mileage" in record:
        text_parts.append(f"Mileage: {record['mileage']} kmpl")
    if "mpg_city" in record or "mpg_highway" in record:
        mpg = f"MPG: City {record.get('mpg_city', 'N/A')}, Highway {record.get('mpg_highway', 'N/A')}"
        text_parts.append(mpg)
    
    # Add safety and features
    if "airbags" in record and record["airbags"]:
        text_parts.append(f"{record['airbags']} airbags")
    if "transmission_type" in record:
        text_parts.append(f"{record['transmission_type']} transmission")
    
    return " | ".join(text_parts)


def get_qdrant_client() -> QdrantClient:
    """
    Initialize and return Qdrant client.
    
    Returns:
        QdrantClient instance
    """
    if QDRANT_API_KEY:
        logger.info(f"Connecting to Qdrant cloud at {QDRANT_URL}")
        return QdrantClient(
            url=QDRANT_URL,
            api_key=QDRANT_API_KEY
        )
    else:
        logger.info(f"Connecting to local Qdrant at {QDRANT_URL}")
        return QdrantClient(url=QDRANT_URL)


def create_collection(client: QdrantClient, collection_name: str, vector_size: int, recreate: bool = False):
    """
    Create or recreate Qdrant collection.
    
    Args:
        client: QdrantClient instance
        collection_name: Name of the collection
        vector_size: Size of embedding vectors
        recreate: If True, delete existing collection first
    """
    try:
        collections = client.get_collections().collections
        collection_exists = any(c.name == collection_name for c in collections)
        
        if collection_exists:
            if recreate:
                logger.info(f"Deleting existing collection: {collection_name}")
                client.delete_collection(collection_name)
            else:
                logger.info(f"Collection {collection_name} already exists. Use --recreate to rebuild.")
                return
        
        logger.info(f"Creating collection: {collection_name} with vector size {vector_size}")
        from qdrant_client.models import PayloadSchemaType
        
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(
                size=vector_size,
                distance=Distance.COSINE
            )
        )
        
        # Create payload indexes for filterable fields (required for Qdrant Cloud)
        logger.info("Creating payload indexes for filterable fields...")
        filterable_fields = [
            ("price_lakhs", PayloadSchemaType.FLOAT),
            ("mileage", PayloadSchemaType.FLOAT),
            ("body_type", PayloadSchemaType.KEYWORD),
            ("fuel_type", PayloadSchemaType.KEYWORD),
            ("segment", PayloadSchemaType.KEYWORD),
            ("transmission_type", PayloadSchemaType.KEYWORD),
            ("year", PayloadSchemaType.INTEGER),
            ("power_bhp", PayloadSchemaType.FLOAT),
            ("seating_capacity", PayloadSchemaType.INTEGER),
            ("airbags", PayloadSchemaType.INTEGER),
        ]
        
        for field_name, field_type in filterable_fields:
            try:
                client.create_payload_index(
                    collection_name=collection_name,
                    field_name=field_name,
                    field_schema=field_type
                )
                logger.info(f"  ✅ Created index for '{field_name}'")
            except Exception as e:
                logger.warning(f"  ⚠️  Could not create index for '{field_name}': {e}")
        
        logger.info(f"Collection {collection_name} created successfully with payload indexes")
        
    except Exception as e:
        logger.error(f"Error creating collection: {e}")
        raise


def load_processed_data(filename: str = "cars_processed.json") -> List[Dict[str, Any]]:
    """Load processed data from JSON file."""
    file_path = DATA_DIR / filename
    if not file_path.exists():
        logger.warning(f"Processed data file not found: {file_path}")
        return []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_data_from_mongodb() -> List[Dict[str, Any]]:
    """
    Load data directly from MongoDB.
    
    Returns:
        List of car records from MongoDB
    """
    try:
        from backend.rag.mongodb_loader import load_cars_from_mongodb
        logger.info("Loading data from MongoDB...")
        cars = load_cars_from_mongodb()
        logger.info(f"Loaded {len(cars)} cars from MongoDB")
        return cars
    except ImportError:
        logger.error("mongodb_loader module not found. Install pymongo: pip install pymongo")
        return []
    except Exception as e:
        logger.error(f"Error loading from MongoDB: {e}")
        return []


def embed_and_upsert(
    records: List[Dict[str, Any]],
    model: SentenceTransformer,
    client: QdrantClient,
    collection_name: str,
    batch_size: int = 50
):
    """
    Generate embeddings and upsert to Qdrant.
    
    Args:
        records: List of car records
        model: SentenceTransformer model
        client: QdrantClient instance
        collection_name: Collection name
        batch_size: Batch size for upserting
    """
    logger.info(f"Generating embeddings for {len(records)} records")
    
    # Generate texts for embedding
    texts = [create_text_from_record(record) for record in records]
    
    # Generate embeddings in batches
    all_embeddings = []
    for i in range(0, len(texts), batch_size):
        batch_texts = texts[i:i + batch_size]
        logger.info(f"Embedding batch {i // batch_size + 1}/{(len(texts) + batch_size - 1) // batch_size}")
        embeddings = model.encode(batch_texts, show_progress_bar=True)
        all_embeddings.extend(embeddings.tolist())
    
    logger.info("Embeddings generated. Upserting to Qdrant...")
    
    # Prepare points for upsert
    points = []
    for idx, (record, embedding, text) in enumerate(zip(records, all_embeddings, texts)):
        # Extract metadata (exclude embedding)
        metadata = {k: v for k, v in record.items() if k != "embedding"}
        
        # Ensure metadata values are JSON-serializable
        clean_metadata = {}
        for k, v in metadata.items():
            if isinstance(v, (str, int, float, bool, type(None))):
                clean_metadata[k] = v
            else:
                clean_metadata[k] = str(v)
        
        # Add page_content for LangChain compatibility
        # LangChain Qdrant expects the text content in payload
        clean_metadata["page_content"] = text
        
        points.append(
            PointStruct(
                id=idx,
                vector=embedding,
                payload=clean_metadata
            )
        )
    
    # Upsert in batches
    import time
    for i in range(0, len(points), batch_size):
        batch_points = points[i:i + batch_size]
        client.upsert(
            collection_name=collection_name,
            points=batch_points
        )
        logger.info(f"Upserted batch {i // batch_size + 1}/{(len(points) + batch_size - 1) // batch_size}")
        # Small delay to avoid rate limiting on cloud
        time.sleep(0.5)
    
    logger.info(f"Successfully upserted {len(points)} points to collection {collection_name}")


def main(recreate: bool = False, use_mongodb: bool = None):
    """
    Main function to embed and upsert data.
    
    Args:
        recreate: Whether to recreate the collection
        use_mongodb: Whether to use MongoDB (overrides env var)
    """
    # Determine data source
    if use_mongodb is None:
        use_mongodb = USE_MONGODB
    
    # Load model
    logger.info(f"Loading embedding model: {EMBEDDING_MODEL}")
    model = SentenceTransformer(EMBEDDING_MODEL)
    vector_size = model.get_sentence_embedding_dimension()
    logger.info(f"Model loaded. Vector size: {vector_size}")
    
    # Initialize Qdrant client
    client = get_qdrant_client()
    
    # Create collection
    create_collection(client, QDRANT_COLLECTION_NAME, vector_size, recreate=recreate)
    
    # Load data
    if use_mongodb:
        logger.info("📊 Using MongoDB as data source")
        cars_data = load_data_from_mongodb()
        faq_data = []  # FAQ can be added to MongoDB later if needed
    else:
        logger.info("📄 Using local JSON files as data source")
        cars_data = load_processed_data("cars_processed.json")
        faq_data = load_processed_data("faq_processed.json")
    
    if not cars_data and not faq_data:
        logger.error("❌ No data found. Check your MongoDB connection or run loader.py first.")
        return
    
    # Combine and embed
    all_records = cars_data + faq_data
    
    if all_records:
        logger.info(f"📦 Embedding {len(all_records)} records ({len(cars_data)} cars, {len(faq_data)} FAQs)")
        embed_and_upsert(all_records, model, client, QDRANT_COLLECTION_NAME)
        logger.info("✅ Embedding and upsert complete!")
        logger.info(f"✅ Total records in Qdrant: {len(all_records)}")
    else:
        logger.warning("⚠️  No records to embed")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate embeddings and upsert to Qdrant")
    parser.add_argument("--recreate", action="store_true", help="Recreate collection if it exists")
    parser.add_argument("--mongodb", action="store_true", help="Use MongoDB as data source")
    parser.add_argument("--local", action="store_true", help="Use local JSON files as data source")
    args = parser.parse_args()
    
    # Determine data source
    use_mongodb = USE_MONGODB
    if args.mongodb:
        use_mongodb = True
    elif args.local:
        use_mongodb = False
    
    main(recreate=args.recreate, use_mongodb=use_mongodb)

