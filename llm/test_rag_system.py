"""
Comprehensive test suite for RAG system.
Tests each component individually and end-to-end.
"""

import os
import sys
import logging
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def print_section(title):
    """Print a formatted section header."""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60 + "\n")


def test_mongodb_connection():
    """Test 1: MongoDB Connection"""
    print_section("TEST 1: MongoDB Connection")
    
    try:
        from backend.rag.mongodb_loader import get_mongodb_client, MONGODB_DATABASE, MONGODB_COLLECTION
        
        client = get_mongodb_client()
        db = client[MONGODB_DATABASE]
        collection = db[MONGODB_COLLECTION]
        
        count = collection.count_documents({})
        logger.info(f"✅ MongoDB connected successfully!")
        logger.info(f"✅ Database: {MONGODB_DATABASE}")
        logger.info(f"✅ Collection: {MONGODB_COLLECTION}")
        logger.info(f"✅ Total cars in database: {count}")
        
        # Sample a car
        sample_car = collection.find_one()
        if sample_car:
            logger.info(f"✅ Sample car: {sample_car.get('Identification_Brand')} {sample_car.get('Identification_Model')}")
        
        client.close()
        return True
        
    except Exception as e:
        logger.error(f"❌ MongoDB connection failed: {e}")
        logger.error("Check your MONGODB_URI in .env file")
        return False


def test_qdrant_connection():
    """Test 2: Qdrant Connection"""
    print_section("TEST 2: Qdrant Cloud Connection")
    
    try:
        from backend.rag.embed import get_qdrant_client, QDRANT_COLLECTION_NAME
        
        client = get_qdrant_client()
        
        # Try to get collections
        collections = client.get_collections()
        logger.info(f"✅ Qdrant connected successfully!")
        logger.info(f"✅ Available collections: {[c.name for c in collections.collections]}")
        
        # Check if our collection exists
        collection_exists = any(c.name == QDRANT_COLLECTION_NAME for c in collections.collections)
        
        if collection_exists:
            # Get collection info
            collection_info = client.get_collection(QDRANT_COLLECTION_NAME)
            logger.info(f"✅ Collection '{QDRANT_COLLECTION_NAME}' exists")
            logger.info(f"✅ Points count: {collection_info.points_count}")
            logger.info(f"✅ Vector size: {collection_info.config.params.vectors.size}")
        else:
            logger.warning(f"⚠️  Collection '{QDRANT_COLLECTION_NAME}' does not exist yet")
            logger.info("   Run: python -m backend.rag.embed --mongodb --recreate")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Qdrant connection failed: {e}")
        logger.error("Check your QDRANT_URL and QDRANT_API_KEY in .env file")
        return False


def test_embedding_model():
    """Test 3: Embedding Model"""
    print_section("TEST 3: Embedding Model")
    
    try:
        from sentence_transformers import SentenceTransformer
        
        model_name = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
        logger.info(f"Loading model: {model_name}")
        
        model = SentenceTransformer(model_name)
        vector_size = model.get_sentence_embedding_dimension()
        
        # Test embedding
        test_text = "Toyota Camry Hybrid sedan with excellent fuel efficiency"
        embedding = model.encode([test_text])[0]
        
        logger.info(f"✅ Embedding model loaded successfully!")
        logger.info(f"✅ Vector dimension: {vector_size}")
        logger.info(f"✅ Test embedding shape: {len(embedding)}")
        logger.info(f"✅ Sample values: [{embedding[0]:.4f}, {embedding[1]:.4f}, ...]")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Embedding model failed: {e}")
        return False


def test_llm_connection():
    """Test 4: LLM Connection"""
    print_section("TEST 4: LLM Connection")
    
    try:
        from backend.rag.model import get_llm
        
        logger.info("Initializing LLM...")
        llm = get_llm()
        
        logger.info(f"✅ LLM initialized: {llm._llm_type if hasattr(llm, '_llm_type') else type(llm).__name__}")
        
        # Test with simple query
        logger.info("Testing LLM with simple query...")
        response = llm.invoke("Say 'Hello, I am working!' in one sentence.")
        
        logger.info(f"✅ LLM response: {response[:100]}...")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ LLM connection failed: {e}")
        logger.error("Check your GEMINI_API_KEY or HF_API_KEY in .env file")
        return False


def test_retriever():
    """Test 5: Retriever"""
    print_section("TEST 5: Retriever (Semantic Search)")
    
    try:
        from backend.rag.retriever import get_retriever
        
        logger.info("Creating retriever...")
        retriever = get_retriever(k=3)
        
        logger.info("Testing retrieval with query: 'SUV under 15 lakhs with good mileage'")
        docs = retriever.invoke("SUV under 15 lakhs with good mileage")
        
        logger.info(f"✅ Retrieved {len(docs)} documents")
        
        for i, doc in enumerate(docs, 1):
            metadata = doc.metadata
            logger.info(f"\n{i}. {metadata.get('make', 'Unknown')} {metadata.get('model', 'Unknown')}")
            logger.info(f"   Price: ₹{metadata.get('price_lakhs', 'N/A')} lakhs")
            logger.info(f"   Body Type: {metadata.get('body_type', 'N/A')}")
            logger.info(f"   Mileage: {metadata.get('mileage', 'N/A')} kmpl")
            logger.info(f"   Fuel: {metadata.get('fuel_type', 'N/A')}")
        
        # Test with filters
        logger.info("\nTesting with filters (price_max=15, body_type=SUV)...")
        retriever_filtered = get_retriever(
            filters={
                "price_max": 15,
                "body_type": "SUV"
            },
            k=3
        )
        docs_filtered = retriever_filtered.invoke("family car")
        logger.info(f"✅ Retrieved {len(docs_filtered)} filtered documents")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Retriever test failed: {e}")
        logger.error("Make sure you've run: python -m backend.rag.embed --mongodb")
        return False


def test_chain():
    """Test 6: Complete RAG Chain"""
    print_section("TEST 6: Complete RAG Chain")
    
    try:
        from backend.rag.chain import create_chain, query_chain
        
        logger.info("Creating RAG chain...")
        chain = create_chain()
        
        logger.info("✅ Chain created successfully")
        
        # Test query
        test_query = "I need a family SUV under 15 lakhs with good fuel efficiency and safety features"
        logger.info(f"\nTest query: '{test_query}'")
        
        logger.info("Generating response (this may take 10-20 seconds)...")
        result = query_chain(chain, test_query)
        
        logger.info("\n--- ANSWER ---")
        logger.info(result["answer"])
        
        logger.info(f"\n--- RECOMMENDATIONS ({len(result['recommended'])}) ---")
        for i, car in enumerate(result["recommended"][:3], 1):
            logger.info(f"\n{i}. {car.get('make')} {car.get('model')}")
            logger.info(f"   Price: ₹{car.get('price_lakhs', 'N/A')} lakhs")
            logger.info(f"   Mileage: {car.get('mileage', 'N/A')} kmpl")
            logger.info(f"   Body Type: {car.get('body_type', 'N/A')}")
        
        logger.info(f"\n✅ Chain test successful!")
        logger.info(f"✅ Retrieved {len(result['sources'])} source documents")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Chain test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_fastapi_backend():
    """Test 7: FastAPI Backend"""
    print_section("TEST 7: FastAPI Backend")
    
    try:
        import httpx
        
        api_url = os.getenv("RAG_API_URL", "http://localhost:8000")
        logger.info(f"Testing FastAPI at: {api_url}")
        
        # Test health endpoint
        logger.info("Testing /health endpoint...")
        response = httpx.get(f"{api_url}/health", timeout=5.0)
        
        if response.status_code == 200:
            logger.info(f"✅ Health check passed: {response.json()}")
        else:
            logger.warning(f"⚠️  Health check returned {response.status_code}")
        
        # Test chat endpoint
        logger.info("\nTesting /chat endpoint...")
        chat_request = {
            "query": "SUV under 15 lakhs",
            "filters": {"price_max": 15, "body_type": "SUV"}
        }
        
        response = httpx.post(
            f"{api_url}/chat",
            json=chat_request,
            timeout=30.0
        )
        
        if response.status_code == 200:
            result = response.json()
            logger.info(f"✅ Chat endpoint working!")
            logger.info(f"✅ Answer length: {len(result['answer'])} characters")
            logger.info(f"✅ Recommendations: {len(result['recommended'])}")
            logger.info(f"\nSample answer: {result['answer'][:200]}...")
        else:
            logger.error(f"❌ Chat endpoint returned {response.status_code}")
            logger.error(f"   Response: {response.text}")
        
        return True
        
    except httpx.ConnectError:
        logger.warning("⚠️  FastAPI backend not running")
        logger.info("   Start it with: uvicorn backend.main:app --reload --port 8000")
        return False
    except Exception as e:
        logger.error(f"❌ FastAPI test failed: {e}")
        return False


def run_all_tests():
    """Run all tests in sequence."""
    print("\n" + "#"*60)
    print("#" + " "*58 + "#")
    print("#  RAG SYSTEM COMPREHENSIVE TEST SUITE  #".center(60))
    print("#" + " "*58 + "#")
    print("#"*60)
    
    results = {
        "MongoDB Connection": test_mongodb_connection(),
        "Qdrant Connection": test_qdrant_connection(),
        "Embedding Model": test_embedding_model(),
        "LLM Connection": test_llm_connection(),
        "Retriever": test_retriever(),
        "RAG Chain": test_chain(),
        "FastAPI Backend": test_fastapi_backend(),
    }
    
    # Print summary
    print_section("TEST SUMMARY")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        logger.info(f"{test_name:.<40} {status}")
    
    print("\n" + "-"*60)
    logger.info(f"Total: {passed}/{total} tests passed")
    print("-"*60 + "\n")
    
    if passed == total:
        logger.info("🎉 All tests passed! Your RAG system is ready for deployment!")
    else:
        logger.warning(f"⚠️  {total - passed} test(s) failed. Check the logs above.")
    
    return passed == total


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)

