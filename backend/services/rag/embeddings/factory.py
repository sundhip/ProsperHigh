from typing import Optional
from backend.services.rag.embeddings.base import BaseEmbeddingProvider
from backend.services.rag.embeddings.deterministic import DeterministicEmbeddingProvider
from backend.core.config import settings


class EmbeddingProviderFactory:
    """Factory for selecting and instantiating embedding providers."""

    _instance: Optional[BaseEmbeddingProvider] = None

    @classmethod
    def get_provider(cls) -> BaseEmbeddingProvider:
        if cls._instance is not None:
            return cls._instance

        # Default to deterministic provider for reproducibility and local operation
        cls._instance = DeterministicEmbeddingProvider(dimension=256)
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None
