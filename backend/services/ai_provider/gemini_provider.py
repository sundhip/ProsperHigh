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


class GeminiProvider(BaseAIProvider):
    """
    Direct REST integration with Google Gemini API supporting structured JSON responses.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: str = "gemini-1.5-flash"
    ):
        self.api_key = api_key or ""
        self.model_name = model_name

    def get_provider_name(self) -> str:
        return "gemini"

    def _prepare_payload(self, request: ModelRequest) -> Dict[str, Any]:
        contents = []
        for msg in request.messages:
            role = "user" if msg["role"] in ["user", "system"] else "model"
            contents.append({
                "role": role,
                "parts": [{"text": msg["content"]}]
            })

        generation_config: Dict[str, Any] = {
            "temperature": request.temperature,
            "maxOutputTokens": request.max_tokens,
        }
        if request.json_mode:
            generation_config["responseMimeType"] = "application/json"

        payload: Dict[str, Any] = {
            "contents": contents,
            "generationConfig": generation_config
        }
        if request.system_prompt:
            payload["systemInstruction"] = {
                "parts": [{"text": request.system_prompt}]
            }
        return payload

    def _process_response(self, data: Dict[str, Any], latency_ms: int) -> ModelResponse:
        candidates = data.get("candidates", [])
        if not candidates:
            raise AIProviderError("Gemini returned no candidates in response.")

        parts = candidates[0].get("content", {}).get("parts", [])
        raw_text = parts[0].get("text", "") if parts else ""

        parsed_json = None
        try:
            parsed_json = json.loads(raw_text)
        except Exception:
            parsed_json = None

        meta = data.get("usageMetadata", {})
        usage = ModelUsage(
            prompt_tokens=meta.get("promptTokenCount", 0),
            completion_tokens=meta.get("candidatesTokenCount", 0),
            total_tokens=meta.get("totalTokenCount", 0)
        )

        return ModelResponse(
            content=raw_text,
            parsed_json=parsed_json,
            model=self.model_name,
            provider="gemini",
            usage=usage,
            latency_ms=latency_ms
        )

    def generate(self, request: ModelRequest) -> ModelResponse:
        if not self.api_key:
            raise AIProviderError("Gemini API key is not configured.")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.api_key}"
        payload = self._prepare_payload(request)

        start_time = time.time()
        try:
            with httpx.Client(timeout=request.timeout_seconds) as client:
                res = client.post(url, json=payload)
        except httpx.TimeoutException as e:
            raise AIProviderTimeoutError(f"Gemini call timed out after {request.timeout_seconds}s: {e}")
        except Exception as e:
            raise AIProviderError(f"Network error calling Gemini: {e}")

        latency_ms = int((time.time() - start_time) * 1000)

        if res.status_code == 429:
            raise AIProviderRateLimitError("Gemini rate limit exceeded.")
        if res.status_code >= 400:
            raise AIProviderError(f"Gemini API returned HTTP {res.status_code}: {res.text}")

        return self._process_response(res.json(), latency_ms)

    async def agenerate(self, request: ModelRequest) -> ModelResponse:
        if not self.api_key:
            raise AIProviderError("Gemini API key is not configured.")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.api_key}"
        payload = self._prepare_payload(request)

        start_time = time.time()
        try:
            async with httpx.AsyncClient(timeout=request.timeout_seconds) as client:
                res = await client.post(url, json=payload)
        except httpx.TimeoutException as e:
            raise AIProviderTimeoutError(f"Gemini call timed out after {request.timeout_seconds}s: {e}")
        except Exception as e:
            raise AIProviderError(f"Network error calling Gemini: {e}")

        latency_ms = int((time.time() - start_time) * 1000)

        if res.status_code == 429:
            raise AIProviderRateLimitError("Gemini rate limit exceeded.")
        if res.status_code >= 400:
            raise AIProviderError(f"Gemini API returned HTTP {res.status_code}: {res.text}")

        return self._process_response(res.json(), latency_ms)
