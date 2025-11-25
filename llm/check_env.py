"""
Environment configuration checker.
Verifies all required environment variables are set correctly.
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_env_var(name, required=True, description=""):
    """Check if environment variable is set."""
    value = os.getenv(name)
    
    if value:
        # Mask sensitive values
        if "KEY" in name or "API" in name or "PASSWORD" in name or "URI" in name:
            masked_value = value[:10] + "..." if len(value) > 10 else "***"
        else:
            masked_value = value
        
        print(f"✅ {name:30} = {masked_value}")
        return True
    else:
        status = "❌ REQUIRED" if required else "⚠️  Optional"
        print(f"{status} {name:30} (Not set) - {description}")
        return not required


def main():
    """Check all environment variables."""
    print("\n" + "="*70)
    print("  RAG SYSTEM - ENVIRONMENT CONFIGURATION CHECK")
    print("="*70 + "\n")
    
    all_good = True
    
    # MongoDB
    print("\n📊 MongoDB Configuration:")
    print("-" * 70)
    all_good &= check_env_var("MONGODB_URI", required=True, description="MongoDB connection string")
    all_good &= check_env_var("MONGODB_DATABASE", required=False, description="Database name (default: autoassist)")
    all_good &= check_env_var("MONGODB_COLLECTION", required=False, description="Collection name (default: cars_new)")
    
    # Qdrant
    print("\n🗄️  Qdrant Configuration:")
    print("-" * 70)
    all_good &= check_env_var("QDRANT_URL", required=True, description="Qdrant cloud URL")
    all_good &= check_env_var("QDRANT_API_KEY", required=True, description="Qdrant API key")
    all_good &= check_env_var("QDRANT_COLLECTION_NAME", required=False, description="Collection name (default: cars_rag)")
    
    # LLM (at least one required)
    print("\n🤖 LLM Configuration (Need at least ONE):")
    print("-" * 70)
    has_groq = check_env_var("GROQ_API_KEY", required=False, description="Groq API key (fastest, recommended)")
    has_gemini = check_env_var("GEMINI_API_KEY", required=False, description="Google Gemini API key")
    has_hf = check_env_var("HF_API_KEY", required=False, description="HuggingFace token") and \
             check_env_var("HF_MODEL_ENDPOINT", required=False, description="HF model endpoint")
    has_ollama = check_env_var("OLLAMA_URL", required=False, description="Ollama URL (local only)") and \
                 check_env_var("OLLAMA_MODEL", required=False, description="Ollama model name")
    
    if has_groq:
        print("   ℹ️  Will use: Groq API ⚡ (fastest, recommended for production)")
    elif has_gemini:
        print("   ℹ️  Will use: Gemini API")
    elif has_hf:
        print("   ℹ️  Will use: HuggingFace API")
    elif has_ollama:
        print("   ℹ️  Will use: Ollama (local development only)")
    else:
        print("   ❌ No LLM configured! Set GROQ_API_KEY (recommended) or GEMINI_API_KEY")
        all_good = False
    
    # Embeddings
    print("\n🔤 Embedding Configuration:")
    print("-" * 70)
    check_env_var("EMBEDDING_MODEL", required=False, description="Embedding model (default: all-MiniLM-L6-v2)")
    check_env_var("RETRIEVAL_K", required=False, description="Number of results to retrieve (default: 5)")
    
    # Other
    print("\n⚙️  Other Configuration:")
    print("-" * 70)
    check_env_var("USE_MONGODB", required=False, description="Use MongoDB vs local files (default: true)")
    check_env_var("LLM_TEMPERATURE", required=False, description="LLM temperature (default: 0.7)")
    
    # Summary
    print("\n" + "="*70)
    if all_good:
        print("✅ Configuration check PASSED!")
        print("\nNext steps:")
        print("  1. Run: python -m backend.rag.mongodb_loader")
        print("  2. Run: python -m backend.rag.embed --mongodb --recreate")
        print("  3. Run: python test_rag_system.py")
        print("  4. Run: uvicorn backend.main:app --reload --port 8000")
    else:
        print("❌ Configuration check FAILED!")
        print("\nPlease fix the issues above and run this script again.")
        print("\nQuick fixes:")
        print("  1. Copy env.example to .env")
        print("  2. Fill in required values:")
        print("     - MONGODB_URI (you have this)")
        print("     - QDRANT_URL and QDRANT_API_KEY (sign up at https://cloud.qdrant.io)")
        print("     - GEMINI_API_KEY (get from https://makersuite.google.com/app/apikey)")
    print("="*70 + "\n")
    
    return 0 if all_good else 1


if __name__ == "__main__":
    sys.exit(main())

