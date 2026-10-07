import time
from concurrent.futures import ThreadPoolExecutor
import pytest
from backend.services.rag.service import rag_service


def test_concurrent_api_load_and_latency(client, test_user_a, auth_headers_user_a, db_session):
    rag_service.ingest_default_documents(db_session)

    # Prepare list of endpoints to hit concurrently
    endpoints = [
        ("GET", "/health/ready", None),
        ("GET", "/api/market/quote/RELIANCE", None),
        ("GET", "/api/stocks/search?q=TCS", None),
        ("GET", "/api/portfolio/me", auth_headers_user_a),
        ("POST", "/api/research/ask", {"json": {"symbol": "RELIANCE", "query": "capex"}, "headers": auth_headers_user_a}),
    ]

    latencies = []

    def make_request(item):
        method, url, extra = item
        start = time.perf_counter()
        if method == "GET":
            headers = extra if extra else {}
            resp = client.get(url, headers=headers)
        else:
            kwargs = extra if extra else {}
            resp = client.post(url, **kwargs)
        duration = (time.perf_counter() - start) * 1000
        return resp.status_code, duration

    # Run 15 concurrent requests across worker threads
    tasks = [endpoints[i % len(endpoints)] for i in range(15)]
    with ThreadPoolExecutor(max_workers=5) as executor:
        results = list(executor.map(make_request, tasks))

    # All should return 200
    for status_code, latency_ms in results:
        assert status_code == 200
        latencies.append(latency_ms)

    avg_latency = sum(latencies) / len(latencies)
    # Average latency should remain well within bounded limits (< 1000ms for in-memory)
    assert avg_latency < 1000.0
