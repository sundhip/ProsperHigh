"""
Backwards-compatibility bridge for RAGService.
Delegates to production vector RAG engine at backend.services.rag.service.
"""
from backend.services.rag.service import RAGService, rag_service

__all__ = ["RAGService", "rag_service"]
