import json
import time
import httpx
from typing import Dict, Any, Optional

from backend.services.ai_provider.base import (
    BaseAIProvider,
    ModelRequest,
    ModelResponse,
    ModelUsage,
    AIProviderError,
    AIProviderTimeoutError,
    AIProviderRateLimitError
)


class OpenAICompatibleProvider(BaseAIProvider):
    """
    Client for any OpenAI-compatible endpoint (OpenRouter, Groq, Local Ollama, OpenAI).
    """

    def __init__(
        self,
        base_url: str = "https://openrouter.ai/api/v1",
        api_key: Optional[str] = None,
        model_name: str = "meta-llama/llama-3.1-8b-instruct",
        provider_name: str = "openrouter"
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key or ""
        self.model_name = model_name
        self.provider_name = provider_name

    def get_provider_name(self) -> str:
        return self.provider_name

    def _prepare_payload(self, request: ModelRequest) -> Dict[str, Any]:
        msgs = []
        if request.system_prompt:
            msgs.append({"role": "system", "content": request.system_prompt})
        msgs.extend(request.messages)

        payload: Dict[str, Any] = {
            "model": self.model_name,
            "messages": msgs,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
        }
        if request.json_mode:
            payload["response_format"] = {"type": "json_object"}
        return payload

    def _headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def _process_response(self, data: Dict[str, Any], latency_ms: int) -> ModelResponse:
        choices = data.get("choices", [])
        if not choices:
            raise AIProviderError("Provider returned no choices in response.")

        raw_content = choices[0].get("message", {}).get("content", "")
        parsed_json = None
        try:
            parsed_json = json.loads(raw_content)
        except Exception:
            parsed_json = None

        usage_raw = data.get("usage", {})
        usage = ModelUsage(
            prompt_tokens=usage_raw.get("prompt_tokens", 0),
            completion_tokens=usage_raw.get("completion_tokens", 0),
            total_tokens=usage_raw.get("total_tokens", 0)
        )

        return ModelResponse(
            content=raw_content,
            parsed_json=parsed_json,
            model=data.get("model", self.model_name),
            provider=self.provider_name,
            usage=usage,
            latency_ms=latency_ms
        )

    def generate(self, request: ModelRequest) -> ModelResponse:
        payload = self._prepare_payload(request)
        headers = self._headers()
        url = f"{self.base_url}/chat/completions"

        start_time = time.time()
        try:
            with httpx.Client(timeout=request.timeout_seconds) as client:
                res = client.post(url, headers=headers, json=payload)
        except httpx.TimeoutException as e:
            raise AIProviderTimeoutError(f"AI Provider call timed out after {request.timeout_seconds}s: {e}")
        except Exception as e:
            raise AIProviderError(f"Network error contacting AI provider: {e}")

        latency_ms = int((time.time() - start_time) * 1000)

        if res.status_code == 429:
            raise AIProviderRateLimitError("Rate limit exceeded on AI provider.")
        if res.status_code >= 400:
            raise AIProviderError(f"AI Provider returned HTTP {res.status_code}: {res.text}")

        return self._process_response(res.json(), latency_ms)

    async def agenerate(self, request: ModelRequest) -> ModelResponse:
        payload = self._prepare_payload(request)
        headers = self._headers()
        url = f"{self.base_url}/chat/completions"

        start_time = time.time()
        try:
            async with httpx.AsyncClient(timeout=request.timeout_seconds) as client:
                res = await client.post(url, headers=headers, json=payload)
        except httpx.TimeoutException as e:
            raise AIProviderTimeoutError(f"AI Provider call timed out after {request.timeout_seconds}s: {e}")
        except Exception as e:
            raise AIProviderError(f"Network error contacting AI provider: {e}")

        latency_ms = int((time.time() - start_time) * 1000)

        if res.status_code == 429:
            raise AIProviderRateLimitError("Rate limit exceeded on AI provider.")
        if res.status_code >= 400:
            raise AIProviderError(f"AI Provider returned HTTP {res.status_code}: {res.text}")

        return self._process_response(res.json(), latency_ms)
