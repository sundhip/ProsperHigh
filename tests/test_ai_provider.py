import pytest
from backend.services.ai_provider.base import (
    ModelRequest,
    ModelResponse,
    AIProviderError,
    AIProviderTimeoutError,
    AIProviderRateLimitError,
    BaseAIProvider
)
from backend.services.ai_provider.deterministic_provider import DeterministicAIProvider
from backend.services.ai_provider.service import AIProviderService


def test_deterministic_provider_generation():
    """Verify DeterministicAIProvider returns structured, valid output with zero external dependency."""
    provider = DeterministicAIProvider()
    req = ModelRequest(
        messages=[{"role": "user", "content": "Analyze TCS"}],
        temperature=0.2,
        max_tokens=500
    )
    res = provider.generate(req)

    assert isinstance(res, ModelResponse)
    assert res.provider == "deterministic"
    assert res.parsed_json is not None
    assert "thesis" in res.parsed_json
    assert "conclusion" in res.parsed_json
    assert "evidence" in res.parsed_json
    assert res.latency_ms >= 0


@pytest.mark.asyncio
async def test_deterministic_provider_async_generation():
    """Verify asynchronous generation on provider."""
    provider = DeterministicAIProvider()
    req = ModelRequest(messages=[{"role": "user", "content": "Test prompt"}])
    res = await provider.agenerate(req)

    assert res.provider == "deterministic"
    assert res.parsed_json is not None


def test_ai_provider_service_bounded_retries_and_fallback():
    """Verify AIProviderService retries transient errors and safely falls back to deterministic provider."""
    service = AIProviderService()

    class FailingTransientProvider(BaseAIProvider):
        call_count = 0
        def get_provider_name(self) -> str:
            return "failing_mock"
        def generate(self, request: ModelRequest) -> ModelResponse:
            self.call_count += 1
            raise AIProviderTimeoutError("Simulated provider network timeout")
        async def agenerate(self, request: ModelRequest) -> ModelResponse:
            self.call_count += 1
            raise AIProviderTimeoutError("Simulated provider network timeout")

    mock_failing = FailingTransientProvider()
    service.set_provider(mock_failing)

    req = ModelRequest(messages=[{"role": "user", "content": "Test"}])
    # Should attempt max_retries + 1, then safely fall back to deterministic provider without crashing
    res = service.generate(req)

    assert mock_failing.call_count == service.max_retries + 1
    assert res.provider == "deterministic"
    assert res.parsed_json is not None
