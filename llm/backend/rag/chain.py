"""
ConversationalRetrievalChain setup for RAG chatbot.
Compatible with LangChain 1.0+ using LCEL pattern.
"""

import logging
import inspect
import asyncio
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional

# LangChain 1.0+ imports
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder, PromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import HumanMessage, AIMessage

from backend.rag.model import get_llm
from backend.rag.retriever import get_retriever
from backend.rag.query_parser import extract_filters_from_query, optimize_query_for_search

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load prompt template
PROMPT_TEMPLATE_PATH = Path(__file__).parent.parent / "prompts" / "base_prompt.txt"


def load_prompt_template() -> str:
    """Load prompt template from file."""
    if PROMPT_TEMPLATE_PATH.exists():
        with open(PROMPT_TEMPLATE_PATH, 'r', encoding='utf-8') as f:
            return f.read()
    else:
        # Default prompt if file doesn't exist
        return """You are a helpful car recommendation assistant. Use the following pieces of context to answer the user's question about cars.

Context:
{context}

Question: {question}

Instructions:
- Use ONLY the information provided in the context above
- Cite specific fields and values from the context (e.g., "The Toyota Camry Hybrid has a price of $28,000")
- If the context doesn't contain enough information to answer the question, say so explicitly
- Do not make up or hallucinate any information
- Provide clear, concise recommendations based on the context

Answer:"""


def _call_sync_or_async(func, *args, **kwargs):
    """Call sync or async function from sync code (block on coroutine)."""
    if inspect.iscoroutinefunction(func):
        # If an event loop is already running (e.g., in some async contexts), use asyncio.run
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                return asyncio.run(func(*args, **kwargs))
            else:
                return loop.run_until_complete(func(*args, **kwargs))
        except RuntimeError:
            return asyncio.run(func(*args, **kwargs))
    else:
        return func(*args, **kwargs)


def _robust_retrieve(retriever, query):
    """
    Try several retrieval method names to be compatible with different LangChain versions.
    Returns a list of Document-like objects.
    """
    # LangChain 1.0+ uses invoke method (Runnable interface)
    if hasattr(retriever, "invoke"):
        try:
            return retriever.invoke(query)
        except Exception as e:
            # Fallback to other methods if invoke fails
            pass
    
    # Try public method first
    if hasattr(retriever, "get_relevant_documents"):
        try:
            return _call_sync_or_async(retriever.get_relevant_documents, query)
        except TypeError:
            # If it requires run_manager, try invoke instead
            if hasattr(retriever, "invoke"):
                return retriever.invoke(query)
    
    # Try retrieve method
    if hasattr(retriever, "retrieve"):
        return _call_sync_or_async(retriever.retrieve, query)
    
    # Last resort: try invoke with proper format
    if hasattr(retriever, "invoke"):
        return retriever.invoke(query)
    
    raise RuntimeError(
        "Retriever object does not expose a recognized retrieval method. "
        "Expected one of: invoke, get_relevant_documents, retrieve."
    )


class ConversationalRetrievalChain:
    """
    Custom ConversationalRetrievalChain compatible with LangChain 1.0+.
    """
    
    def __init__(self, llm, retriever, prompt_template: str, memory: Optional[Dict] = None):
        self.llm = llm
        self.retriever = retriever
        self.prompt_template = prompt_template
        self.memory = memory or {"chat_history": []}
        
        # Create prompt
        self.prompt = PromptTemplate(
            template=prompt_template,
            input_variables=["context", "question", "chat_history"]
        )
        
        # Build chain using LCEL
        self.chain = self._build_chain()
    
    def _build_chain(self):
        """Build the retrieval chain using LCEL."""
        def format_docs(docs):
            """Format documents with rich metadata for better context."""
            if not docs:
                return "No relevant cars found in the database."
            
            formatted = []
            for i, doc in enumerate(docs, 1):
                page_content = doc.page_content if hasattr(doc, 'page_content') else str(doc)
                metadata = doc.metadata if hasattr(doc, 'metadata') else {}
                
                # Build a structured entry for each car
                car_entry = f"--- Car {i} ---\n"
                
                # Add the description/page_content first
                car_entry += f"Description: {page_content}\n"
                
                # Add key metadata fields for easy reference
                if metadata:
                    key_fields = []
                    if metadata.get('make'):
                        key_fields.append(f"Brand: {metadata['make']}")
                    if metadata.get('model'):
                        key_fields.append(f"Model: {metadata['model']}")
                    if metadata.get('variant'):
                        key_fields.append(f"Variant: {metadata['variant']}")
                    if metadata.get('year'):
                        key_fields.append(f"Year: {metadata['year']}")
                    if metadata.get('price_lakhs'):
                        key_fields.append(f"Price: ₹{metadata['price_lakhs']:.2f} lakhs")
                    if metadata.get('mileage'):
                        key_fields.append(f"Mileage: {metadata['mileage']} kmpl")
                    if metadata.get('fuel_type'):
                        key_fields.append(f"Fuel Type: {metadata['fuel_type']}")
                    if metadata.get('body_type'):
                        key_fields.append(f"Body Type: {metadata['body_type']}")
                    if metadata.get('transmission_type'):
                        key_fields.append(f"Transmission: {metadata['transmission_type']}")
                    if metadata.get('airbags'):
                        key_fields.append(f"Airbags: {metadata['airbags']}")
                    if metadata.get('power_bhp'):
                        key_fields.append(f"Power: {metadata['power_bhp']} bhp")
                    
                    if key_fields:
                        car_entry += " | ".join(key_fields) + "\n"
                
                formatted.append(car_entry)
            
            return "\n\n".join(formatted)
        
        def format_chat_history(history):
            if not history:
                return ""
            formatted = []
            # Extract key context from last 5 exchanges
            for msg in history[-5:]:  # Last 5 messages
                if isinstance(msg, dict):
                    if "human" in msg:
                        formatted.append(f"Human: {msg['human']}")
                    if "ai" in msg:
                        # Extract key information from AI response for context
                        ai_response = msg['ai']
                        import re
                        context_summary = []
                        
                        # Extract price
                        prices = re.findall(r'₹(\d+(?:\.\d+)?)\s*lakhs?', ai_response)
                        if prices:
                            context_summary.append(f"Price: ₹{prices[0]}L")
                        
                        # Extract body type
                        body_types = re.findall(r'\b(SUV|Sedan|Hatchback|MUV)\b', ai_response, re.IGNORECASE)
                        if body_types:
                            context_summary.append(f"Type: {body_types[0]}")
                        
                        if context_summary:
                            formatted.append(f"AI: [{', '.join(context_summary)}] {ai_response[:200]}...")
                        else:
                            formatted.append(f"AI: {ai_response[:200]}...")
                elif isinstance(msg, tuple):
                    user_q, ai_a = msg
                    formatted.append(f"Human: {user_q}")
                    # Extract context from AI response
                    import re
                    context_summary = []
                    prices = re.findall(r'₹(\d+(?:\.\d+)?)\s*lakhs?', ai_a)
                    if prices:
                        context_summary.append(f"Price: ₹{prices[0]}L")
                    body_types = re.findall(r'\b(SUV|Sedan|Hatchback|MUV)\b', ai_a, re.IGNORECASE)
                    if body_types:
                        context_summary.append(f"Type: {body_types[0]}")
                    if context_summary:
                        formatted.append(f"AI: [{', '.join(context_summary)}] {ai_a[:200]}...")
                    else:
                        formatted.append(f"AI: {ai_a[:200]}...")
            return "\n".join(formatted)
        
        def retrieve_and_format(inputs: Dict[str, Any]) -> Dict[str, Any]:
            question = inputs["question"]
            chat_history = inputs.get("chat_history", [])
            
            # Retrieve documents (robust across LangChain versions)
            docs = _robust_retrieve(self.retriever, question)
            
            # Format context
            context = format_docs(docs)
            history_str = format_chat_history(chat_history)
            
            return {
                "context": context,
                "question": question,
                "chat_history": history_str,
                "source_documents": docs
            }
        
        # Create the chain
        # Handle both chat models (return messages) and LLM models (return strings)
        if hasattr(self.llm, 'invoke'):
            # Chat model - needs StrOutputParser
            chain = (
                RunnableLambda(lambda x: {"question": x["question"], "chat_history": x.get("chat_history", [])})
                | RunnableLambda(retrieve_and_format)
                | RunnableLambda(lambda x: self.prompt.format(**x))
                | self.llm
                | StrOutputParser()
            )
        else:
            # LLM model - returns string directly
            chain = (
                RunnableLambda(lambda x: {"question": x["question"], "chat_history": x.get("chat_history", [])})
                | RunnableLambda(retrieve_and_format)
                | RunnableLambda(lambda x: self.prompt.format(**x))
                | self.llm
            )
        
        return chain
    
    def __call__(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Run the chain."""
        question = inputs["question"]
        chat_history = inputs.get("chat_history", self.memory.get("chat_history", []))
        
        # Run chain
        answer = self.chain.invoke({
            "question": question,
            "chat_history": chat_history
        })
        
        # Get source documents from the retrieval step (robust)
        docs = _robust_retrieve(self.retriever, question)
        
        # Update memory
        self.memory["chat_history"].append((question, answer))
        if len(self.memory["chat_history"]) > 10:  # Keep last 10 messages
            self.memory["chat_history"] = self.memory["chat_history"][-10:]
        
        return {
            "answer": answer,
            "source_documents": docs
        }
    
    @classmethod
    def from_llm(cls, llm, retriever, memory=None, return_source_documents=True, verbose=False, combine_docs_chain_kwargs=None):
        """Create chain from LLM and retriever (compatible with old API)."""
        prompt_template = load_prompt_template()
        if combine_docs_chain_kwargs and "prompt" in combine_docs_chain_kwargs:
            prompt_template = combine_docs_chain_kwargs["prompt"].template
        
        return cls(llm=llm, retriever=retriever, prompt_template=prompt_template, memory=memory)


def create_chain(filters: Dict[str, Any] = None, k: int = None) -> ConversationalRetrievalChain:
    """
    Create ConversationalRetrievalChain with retriever and LLM.
    
    Args:
        filters: Metadata filters for retrieval
        k: Number of documents to retrieve
        
    Returns:
        ConversationalRetrievalChain instance
    """
    logger.info("Creating ConversationalRetrievalChain")
    
    # Get LLM
    llm = get_llm()
    
    # Get retriever
    retriever = get_retriever(filters=filters, k=k)
    
    # Load prompt template
    prompt_template = load_prompt_template()
    
    # Create memory
    memory = {"chat_history": []}
    
    # Create chain
    chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=retriever,
        memory=memory,
        return_source_documents=True,
        verbose=True,
        combine_docs_chain_kwargs={"prompt": PromptTemplate(template=prompt_template, input_variables=["context", "question", "chat_history"])}
    )
    
    logger.info("Chain created successfully")
    return chain


def post_process_answer(answer: str) -> str:
    """
    Post-process the LLM answer to improve quality and consistency.
    Removes markdown artifacts and ensures clean formatting.
    
    Args:
        answer: Raw LLM response
        
    Returns:
        Cleaned and improved answer
    """
    if not answer:
        return "I apologize, but I couldn't generate a response. Please try rephrasing your question."
    
    # Remove any unwanted prefixes/suffixes
    answer = answer.strip()
    
    # Remove common LLM artifacts
    answer = answer.replace("Answer:", "").replace("Response:", "").strip()
    
    import re
    
    # Remove markdown headers (###, ##, #) - replace with plain text
    answer = re.sub(r'^#{1,6}\s+(.+)$', r'\1', answer, flags=re.MULTILINE)
    
    # Remove bold markers (**text** or __text__)
    answer = re.sub(r'\*\*(.+?)\*\*', r'\1', answer)
    answer = re.sub(r'__(.+?)__', r'\1', answer)
    
    # Remove italic markers (*text* or _text_)
    answer = re.sub(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', r'\1', answer)
    answer = re.sub(r'(?<!_)_(?!_)(.+?)(?<!_)_(?!_)', r'\1', answer)
    
    # Clean up bullet points - ensure consistent format
    # Replace various bullet formats with simple "• "
    answer = re.sub(r'^[\*\-\+]\s+', '• ', answer, flags=re.MULTILINE)
    
    # Fix numbered lists followed by bullets (convert to bullets)
    answer = re.sub(r'^\d+\.\s+', '• ', answer, flags=re.MULTILINE)
    
    # Clean up excessive newlines (more than 2 consecutive)
    answer = re.sub(r'\n{3,}', '\n\n', answer)
    
    # Remove any remaining markdown-style formatting artifacts
    answer = answer.replace('**•', '•')
    answer = answer.replace('**', '')
    
    # Ensure bullets have proper spacing
    lines = answer.split('\n')
    cleaned_lines = []
    for line in lines:
        # Don't strip lines that are intentionally empty (paragraph breaks)
        if line.strip():
            # Ensure bullet points have space after them
            if line.strip().startswith('•') and not line.strip().startswith('• '):
                line = line.replace('•', '• ', 1)
            cleaned_lines.append(line.strip())
        else:
            # Keep empty lines for paragraph breaks
            if cleaned_lines and cleaned_lines[-1] != '':
                cleaned_lines.append('')
    
    answer = '\n'.join(cleaned_lines)
    
    return answer


def query_chain(
    chain: ConversationalRetrievalChain,
    query: str,
    chat_history: List[Tuple[str, str]] = None
) -> Dict[str, Any]:
    """
    Query the chain and return formatted response.
    
    Args:
        chain: ConversationalRetrievalChain instance
        query: User query
        chat_history: List of (question, answer) tuples
        
    Returns:
        Dictionary with answer, recommended cars, and sources
    """
    logger.info(f"Querying chain with: {query}")
    
    # Prepare input
    inputs = {"question": query}
    if chat_history:
        inputs["chat_history"] = chat_history
    
    # Run chain
    result = chain(inputs)
    
    # Extract answer and source documents
    raw_answer = result.get("answer", "")
    source_documents = result.get("source_documents", [])
    
    # Post-process the answer for better quality
    answer = post_process_answer(raw_answer)
    
    # Extract recommended cars from source documents
    # De-duplicate by brand+model to avoid showing multiple variants
    seen_models = set()
    recommended = []
    sources = []
    
    for doc in source_documents:
        # Extract metadata from document
        metadata = doc.metadata if hasattr(doc, 'metadata') else {}
        page_content = doc.page_content if hasattr(doc, 'page_content') else str(doc)
        
        # DEBUG: Log what we're receiving
        logger.debug(f"Document type: {type(doc)}")
        logger.debug(f"Document metadata keys: {list(metadata.keys())[:10] if metadata else 'NO METADATA'}")
        
        # De-duplicate: Skip if we already have this brand+model
        make = metadata.get("make", "Unknown")
        model = metadata.get("model", "Unknown")
        
        # Clean up brand/model names for comparison
        # Remove underscores and normalize case
        make_clean = make.replace("_", " ").strip().lower()
        model_clean = model.replace("_", " ").strip().lower()
        model_key = f"{make_clean}|{model_clean}"
        
        logger.debug(f"Processing: {make} {model} (key: {model_key})")
        
        if model_key in seen_models:
            logger.debug(f"  → SKIPPED (duplicate model)")
            continue  # Skip this variant
        
        seen_models.add(model_key)
        logger.debug(f"  → ADDED (unique model)")
        
        # Format car information for frontend
        # Include MongoDB _id so Next.js API can fetch full car data
        car_info = {
            "id": metadata.get("id", ""),  # MongoDB _id for fetching full data
            "name": f"{make} {model}",
            "make": make,  # Also include separately for search
            "model": model,
            "price": metadata.get("price_lakhs", 0),  # Frontend expects price in lakhs
            "mileage": metadata.get("mileage", 0),     # Frontend expects mileage in kmpl
        }
        
        # Add optional fields if available
        if "variant" in metadata and metadata["variant"]:
            car_info["variant"] = metadata["variant"]
            car_info["name"] = f"{car_info['name']} {metadata['variant']}"
        
        if "year" in metadata:
            car_info["year"] = metadata["year"]
        
        if "body_type" in metadata:
            car_info["body_type"] = metadata["body_type"]
        
        if "segment" in metadata:
            car_info["segment"] = metadata["segment"]
        
        if "fuel_type" in metadata:
            car_info["fuel_type"] = metadata["fuel_type"]
        
        if "power_bhp" in metadata:
            car_info["power_bhp"] = metadata["power_bhp"]
        
        if "airbags" in metadata:
            car_info["airbags"] = metadata["airbags"]
        
        if "transmission_type" in metadata:
            car_info["transmission_type"] = metadata["transmission_type"]
        
        # Add score if available (from similarity search)
        if hasattr(doc, 'score'):
            car_info["score"] = doc.score * 100  # Convert to percentage
        
        recommended.append(car_info)
        
        # Add source info
        sources.append({
            "content": page_content[:200] + "..." if len(page_content) > 200 else page_content,
            "metadata": metadata
        })
    
    logger.info(f"✅ De-duplicated to {len(recommended)} unique car models (from {len(source_documents)} total variants)")
    logger.info(f"   Models: {[r.get('name', 'Unknown') for r in recommended[:5]]}")
    
    # Sort recommendations by relevance (could be by score if available)
    # For now, keep them in retrieval order (most relevant first)
    
    # Log answer length for debugging
    logger.info(f"Generated answer length: {len(answer)} characters")
    
    return {
        "answer": answer,
        "recommended": recommended,
        "sources": sources
    }
