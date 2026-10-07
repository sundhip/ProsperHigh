from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from datetime import datetime


class AIProviderError(Exception):
    """Base exception for AI model provider operations."""
    pass


class AIProviderTimeoutError(AIProviderError):
    """Raised when an AI provider call exceeds its timeout limit."""
    pass


class AIProviderRateLimitError(AIProviderError):
    """Raised when an AI provider rate limit is encountered."""
    pass


class AIProviderValidationError(AIProviderError):
    """Raised when model output fails schema validation."""
    pass


@dataclass
class ModelUsage:
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    estimated_cost_usd: float = 0.0


@dataclass
class ModelRequest:
    messages: List[Dict[str, str]]
    system_prompt: Optional[str] = None
    temperature: float = 0.2
    max_tokens: int = 1500
    json_mode: bool = True
    timeout_seconds: float = 15.0


@dataclass
class ModelResponse:
    content: str
    parsed_json: Optional[Dict[str, Any]] = None
    model: str = "unknown"
    provider: str = "unknown"
    usage: ModelUsage = field(default_factory=ModelUsage)
    latency_ms: int = 0
    created_at: datetime = field(default_factory=datetime.utcnow)


class BaseAIProvider(ABC):
    """Abstract interface for all LLM / AI model providers."""

    @abstractmethod
    def generate(self, request: ModelRequest) -> ModelResponse:
        """Synchronous generation."""
        pass

    @abstractmethod
    async def agenerate(self, request: ModelRequest) -> ModelResponse:
        """Asynchronous generation."""
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        """Returns the identifier name of this provider."""
        pass
