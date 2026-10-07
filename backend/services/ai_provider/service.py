import os
import time
import asyncio
from typing import Optional, Dict, Any

from backend.services.ai_provider.base import (
    BaseAIProvider,
    ModelRequest,
    ModelResponse,
    AIProviderError,
    AIProviderTimeoutError,
    AIProviderRateLimitError,
    AIProviderValidationError
)
from backend.services.ai_provider.deterministic_provider import DeterministicAIProvider
from backend.services.ai_provider.openai_compatible_provider import OpenAICompatibleProvider
from backend.services.ai_provider.gemini_provider import GeminiProvider


class AIProviderService:
    """
    Centralized model routing service with timeout management, bounded retry policy,
    and automatic fallback to deterministic provider when external APIs are unconfigured or failing.
    """

    def __init__(self):
        self.provider_type = os.getenv("AI_PROVIDER", "").lower()
        self.max_retries = int(os.getenv("AI_MAX_RETRIES", "2"))
        self.default_timeout = float(os.getenv("AI_TIMEOUT_SECONDS", "15.0"))
        self._provider = self._init_provider()

    def _init_provider(self) -> BaseAIProvider:
        # Check explicit configuration
        gemini_key = os.getenv("GEMINI_API_KEY")
        openrouter_key = os.getenv("OPENROUTER_API_KEY")
        groq_key = os.getenv("GROQ_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")

        if self.provider_type == "gemini" and gemini_key:
            model = os.getenv("AI_MODEL", "gemini-1.5-flash")
            return GeminiProvider(api_key=gemini_key, model_name=model)

        if self.provider_type == "openrouter" and openrouter_key:
            model = os.getenv("AI_MODEL", "meta-llama/llama-3.1-8b-instruct")
            return OpenAICompatibleProvider(
                base_url="https://openrouter.ai/api/v1",
                api_key=openrouter_key,
                model_name=model,
                provider_name="openrouter"
            )

        if self.provider_type == "groq" and groq_key:
            model = os.getenv("AI_MODEL", "llama-3.1-8b-instant")
            return OpenAICompatibleProvider(
                base_url="https://api.groq.com/openai/v1",
                api_key=groq_key,
                model_name=model,
                provider_name="groq"
            )

        if self.provider_type == "ollama":
            endpoint = os.getenv("OLLAMA_ENDPOINT", "http://localhost:11434/v1")
            model = os.getenv("AI_MODEL", "qwen2.5:7b")
            return OpenAICompatibleProvider(
                base_url=endpoint,
                api_key="ollama",
                model_name=model,
                provider_name="ollama"
            )

        # Default / Fallback: Deterministic verified provider (zero external dependency, 100% reliable)
        return DeterministicAIProvider()

    def set_provider(self, provider: BaseAIProvider):
        """Allows injecting custom or test providers dynamically."""
        self._provider = provider

    def get_active_provider_name(self) -> str:
        return self._provider.get_provider_name()

    def generate(self, request: ModelRequest) -> ModelResponse:
        """Synchronous execution with bounded exponential-backoff retries."""
        last_error: Optional[Exception] = None
        for attempt in range(self.max_retries + 1):
            try:
                return self._provider.generate(request)
            except (AIProviderTimeoutError, AIProviderRateLimitError) as e:
                last_error = e
                if attempt < self.max_retries:
                    time.sleep(0.5 * (2 ** attempt))
                else:
                    break
            except AIProviderValidationError as e:
                # Do not retry validation failures repeatedly
                raise e
            except Exception as e:
                last_error = e
                if attempt < self.max_retries:
                    time.sleep(0.5 * (2 ** attempt))
                else:
                    break

        # Fallback to deterministic provider if external provider exhausted retries
        if not isinstance(self._provider, DeterministicAIProvider):
            fallback = DeterministicAIProvider()
            return fallback.generate(request)

        raise AIProviderError(f"AI Provider execution failed after {self.max_retries} retries: {last_error}")

    async def agenerate(self, request: ModelRequest) -> ModelResponse:
        """Asynchronous execution with bounded exponential-backoff retries."""
        last_error: Optional[Exception] = None
        for attempt in range(self.max_retries + 1):
            try:
                return await self._provider.agenerate(request)
            except (AIProviderTimeoutError, AIProviderRateLimitError) as e:
                last_error = e
                if attempt < self.max_retries:
                    await asyncio.sleep(0.5 * (2 ** attempt))
                else:
                    break
            except AIProviderValidationError as e:
                raise e
            except Exception as e:
                last_error = e
                if attempt < self.max_retries:
                    await asyncio.sleep(0.5 * (2 ** attempt))
                else:
                    break

        if not isinstance(self._provider, DeterministicAIProvider):
            fallback = DeterministicAIProvider()
            return await fallback.agenerate(request)

        raise AIProviderError(f"AI Provider execution failed after {self.max_retries} retries: {last_error}")


ai_provider_service = AIProviderService()
