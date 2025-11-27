"""
LLM wrapper for Ollama (local) or hosted Llama API.
Provides LangChain-compatible interface.
"""

import logging
import os
from typing import Optional

from dotenv import load_dotenv
try:
    from langchain_community.llms import Ollama
    from langchain_core.language_models.llms import BaseLLM as LLM
    from langchain_core.callbacks.manager import CallbackManagerForLLMRun
except ImportError:
    # Fallback for older LangChain versions
    try:
        from langchain.llms import Ollama
        from langchain.llms.base import LLM
        from langchain.callbacks.manager import CallbackManagerForLLMRun
    except ImportError:
        from langchain_community.llms import Ollama
        from langchain.llms.base import LLM
        from langchain.callbacks.manager import CallbackManagerForLLMRun
from pydantic import Field
import httpx

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Environment variables
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama2")
HF_API_KEY = os.getenv("HF_API_KEY", None)
HF_MODEL_ENDPOINT = os.getenv("HF_MODEL_ENDPOINT", None)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", None)
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-pro")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", None)
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-70b-versatile")
LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.4"))  # Lowered from 0.7 for more factual responses
LLM_TOP_P = float(os.getenv("LLM_TOP_P", "0.95"))  # Slightly increased for better coherence


class GroqLLM(LLM):
    """
    LangChain-compatible wrapper for Groq API.
    Fast inference with Llama, Mixtral, and other models.
    """
    
    api_key: str = Field(default="")
    model: str = Field(default="llama-3.1-70b-versatile")
    temperature: float = Field(default=0.4)
    max_tokens: int = Field(default=2048)  # Increased for longer, more detailed responses
    
    @property
    def _llm_type(self) -> str:
        return "groq"
    
    def _call(
        self,
        prompt: str,
        stop: Optional[list] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs
    ) -> str:
        """Call Groq API."""
        try:
            from groq import Groq
            
            client = Groq(api_key=self.api_key)
            
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                top_p=LLM_TOP_P,
                stream=False,
                stop=stop
            )
            
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            raise
    
    def _generate(
        self,
        prompts: list,
        stop: Optional[list] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs
    ):
        """Generate responses for prompts (required by LangChain LLM base class)."""
        from langchain_core.outputs import Generation, LLMResult
        
        generations = []
        for prompt in prompts:
            try:
                text = self._call(prompt, stop=stop, run_manager=run_manager, **kwargs)
                generations.append([Generation(text=text)])
            except Exception as e:
                logger.error(f"Error generating with Groq: {e}")
                generations.append([Generation(text=f"Error: {str(e)}")])
        
        return LLMResult(generations=generations)


class GeminiLLM(LLM):
    """
    LangChain-compatible wrapper for Google Gemini API.
    """
    
    api_key: str = Field(default="")
    model: str = Field(default="gemini-pro")
    temperature: float = Field(default=0.4)
    
    @property
    def _llm_type(self) -> str:
        return "gemini"
    
    def _call(
        self,
        prompt: str,
        stop: Optional[list] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs
    ) -> str:
        """Call Gemini API."""
        try:
            from google.generativeai import GenerativeModel, configure
            
            configure(api_key=self.api_key)
            model = GenerativeModel(self.model)
            
            generation_config = {
                "temperature": self.temperature,
                "top_p": LLM_TOP_P,
                "max_output_tokens": 2048,
            }
            
            response = model.generate_content(
                prompt,
                generation_config=generation_config
            )
            
            return response.text
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            raise


class HostedLlamaLLM(LLM):
    """
    LangChain-compatible wrapper for hosted Llama API (e.g., HuggingFace Inference API).
    """
    
    endpoint: str = Field(default="")
    api_key: Optional[str] = Field(default=None)
    temperature: float = Field(default=0.7)
    top_p: float = Field(default=0.9)
    
    @property
    def _llm_type(self) -> str:
        return "hosted_llama"
    
    def _call(
        self,
        prompt: str,
        stop: Optional[list] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs
    ) -> str:
        """Call the hosted LLM API."""
        return self._generate([prompt], stop=stop, run_manager=run_manager, **kwargs).generations[0][0].text
    
    def _generate(
        self,
        prompts: list,
        stop: Optional[list] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs
    ):
        """Generate responses for prompts (required by LangChain LLM base class)."""
        from langchain_core.outputs import Generation, LLMResult
        
        generations = []
        for prompt in prompts:
            try:
                headers = {
                    "Content-Type": "application/json"
                }
                if self.api_key:
                    headers["Authorization"] = f"Bearer {self.api_key}"
                
                # Try different payload formats for compatibility
                payload = {
                    "inputs": prompt,
                    "parameters": {
                        "temperature": self.temperature,
                        "top_p": self.top_p,
                        "max_new_tokens": 256,
                        "return_full_text": False
                    }
                }
                
                response = httpx.post(
                    self.endpoint,
                    json=payload,
                    headers=headers,
                    timeout=60.0  # Longer timeout for model loading
                )
                
                # Handle 503 (model loading) - wait and retry once
                if response.status_code == 503:
                    logger.info("Model is loading, waiting 10 seconds...")
                    import time
                    time.sleep(10)
                    response = httpx.post(
                        self.endpoint,
                        json=payload,
                        headers=headers,
                        timeout=60.0
                    )
                
                # Handle 410 (Gone) - model no longer available
                if response.status_code == 410:
                    error_msg = (
                        f"Model endpoint returned 410 Gone. The model at {self.endpoint} is no longer available.\n"
                        f"Please install Ollama (recommended) or update HF_MODEL_ENDPOINT in .env to a valid model."
                    )
                    logger.error(error_msg)
                    raise ValueError(error_msg)
                
                response.raise_for_status()
                result = response.json()
                
                # Handle different response formats
                text = ""
                if isinstance(result, list) and len(result) > 0:
                    if "generated_text" in result[0]:
                        text = result[0]["generated_text"]
                    elif isinstance(result[0], dict) and "text" in result[0]:
                        text = result[0]["text"]
                    elif isinstance(result[0], str):
                        text = result[0]
                    elif "summary_text" in result[0]:
                        text = result[0]["summary_text"]
                
                # Fallback: try to extract text from response
                if not text and isinstance(result, dict):
                    if "generated_text" in result:
                        text = result["generated_text"]
                    elif "text" in result:
                        text = result["text"]
                    elif "summary_text" in result:
                        text = result["summary_text"]
                
                if not text:
                    logger.warning(f"Unexpected response format: {result}")
                    text = str(result)
                
                generations.append([Generation(text=text)])
                
            except ValueError as ve:
                # Re-raise ValueError (contains 410 Gone error with helpful message)
                raise
            except Exception as e:
                logger.error(f"Error calling hosted LLM: {e}")
                # Return error message as generation for other errors
                generations.append([Generation(text=f"Error: {str(e)}")])
        
        return LLMResult(generations=generations)


def get_llm() -> LLM:
    """
    Get LLM instance based on environment configuration.
    Prioritizes Groq (fastest), then Gemini, HuggingFace, and Ollama for local dev.
    
    Returns:
        LangChain LLM instance
    """
    # Prioritize Groq API (fastest, best for production)
    if GROQ_API_KEY:
        logger.info("⚡ Using Groq API (fastest inference - production ready)")
        try:
            llm = GroqLLM(
                api_key=GROQ_API_KEY,
                model=GROQ_MODEL,
                temperature=LLM_TEMPERATURE,
                max_tokens=3072  # Increased for detailed car comparisons
            )
            # Test connection
            try:
                test_result = llm.invoke("Hello", config={"callbacks": []})
                logger.info(f"✅ Groq LLM initialized successfully (model: {GROQ_MODEL})")
                return llm
            except Exception as test_error:
                logger.error(f"Groq test failed: {test_error}")
                raise
        except Exception as e:
            logger.warning(f"⚠️  Failed to initialize Groq: {e}")
            if not ((HF_API_KEY and HF_MODEL_ENDPOINT) or GEMINI_API_KEY or OLLAMA_URL):
                raise ValueError(
                    "❌ Groq API failed. Please check:\n"
                    "1. GROQ_API_KEY is set correctly in .env\n"
                    "2. Get API key from: https://console.groq.com/keys\n"
                    "Alternative: Configure Gemini or HuggingFace API"
                )
    
    # Fall back to Gemini API if available
    if GEMINI_API_KEY:
        logger.info("🚀 Using Google Gemini API (production-ready)")
        try:
            # Check if Ollama is reachable first
            import httpx
            try:
                response = httpx.get(f"{OLLAMA_URL}/api/tags", timeout=2.0)
                response.raise_for_status()
                logger.info("✅ Ollama is reachable")
            except Exception as conn_error:
                logger.warning(f"⚠️  Ollama not reachable at {OLLAMA_URL}: {conn_error}")
                raise ValueError(
                    "❌ Ollama not available. For local development:\n"
                    "1. Install from https://ollama.ai\n"
                    "2. Run: ollama serve\n"
                    "3. Run: ollama pull llama2\n\n"
                    "For production deployment, use Gemini API instead:\n"
                    "Get free API key: https://makersuite.google.com/app/apikey"
                )
            
            from langchain_community.llms import Ollama
            llm = Ollama(
                base_url=OLLAMA_URL,
                model=OLLAMA_MODEL,
                temperature=LLM_TEMPERATURE,
                top_p=LLM_TOP_P
            )
            # Test connection
            try:
                test_result = llm.invoke("test", config={"callbacks": []})
                logger.info(f"✅ Ollama LLM initialized successfully (model: {OLLAMA_MODEL})")
                logger.warning("⚠️  Note: Ollama is for local development only. Use Gemini for production.")
                return llm
            except Exception as test_error:
                logger.error(f"Ollama test failed: {test_error}")
                logger.info(f"Make sure model '{OLLAMA_MODEL}' is installed: ollama pull {OLLAMA_MODEL}")
                raise
        except Exception as e:
            logger.error(f"❌ Failed to initialize Ollama: {e}")
            if not ((HF_API_KEY and HF_MODEL_ENDPOINT) or GEMINI_API_KEY):
                raise ValueError(
                    "❌ No LLM available. Please configure one of:\n\n"
                    "For PRODUCTION (recommended):\n"
                    "1. Gemini API: https://makersuite.google.com/app/apikey\n"
                    "   Set GEMINI_API_KEY in .env\n\n"
                    "For DEVELOPMENT:\n"
                    "2. Ollama (local): https://ollama.ai\n"
                    "   Install, run 'ollama serve', then 'ollama pull llama2'"
                )
    
    # If neither is configured, raise error
    raise ValueError(
        "❌ No LLM configured. Please set ONE of the following in .env:\n\n"
        "PRODUCTION (Recommended):\n"
        "  GROQ_API_KEY=your-key-here  ⚡ FASTEST & FREE\n"
        "  Get from: https://console.groq.com/keys\n\n"
        "Alternative:\n"
        "  GEMINI_API_KEY=your-key-here\n"
        "  Get from: https://makersuite.google.com/app/apikey\n\n"
        "  HF_API_KEY=your-token\n"
        "  HF_MODEL_ENDPOINT=https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2\n"
        "  Get from: https://huggingface.co/settings/tokens\n\n"
        "Local Development Only:\n"
        "  OLLAMA_URL=http://localhost:11434\n"
        "  OLLAMA_MODEL=llama2\n"
        "  Install: https://ollama.ai"
    )

