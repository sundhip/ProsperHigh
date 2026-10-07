import math
import re
import hashlib
from typing import List
from backend.services.rag.embeddings.base import BaseEmbeddingProvider


class DeterministicEmbeddingProvider(BaseEmbeddingProvider):
    """
    Deterministic, zero-external-dependency embedding provider.
    Computes normalized feature-hashed semantic n-gram embeddings.
    Allows offline testing, reproducible evaluation, and rapid retrieval
    without external API reliance or network flakiness.
    """

    def __init__(self, dimension: int = 256):
        self._dim = dimension

    @property
    def dimension(self) -> int:
        return self._dim

    def _tokenize(self, text: str) -> List[str]:
        cleaned = re.sub(r"[^\w\s]", " ", text.lower())
        return [w for w in cleaned.split() if len(w) > 1]

    def _hash_token(self, token: str, seed: int = 0) -> int:
        data = f"{seed}:{token}".encode("utf-8")
        h = int(hashlib.sha256(data).hexdigest(), 16)
        return h % self._dim

    def embed_text(self, text: str) -> List[float]:
        vec = [0.0] * self._dim
        tokens = self._tokenize(text)
        if not tokens:
            return vec

        # 1. Unigrams
        for i, t in enumerate(tokens):
            idx = self._hash_token(t, seed=1)
            sign = 1.0 if (self._hash_token(t, seed=2) % 2 == 0) else -1.0
            vec[idx] += 1.0 * sign

        # 2. Bigrams
        for i in range(len(tokens) - 1):
            bg = f"{tokens[i]}_{tokens[i+1]}"
            idx = self._hash_token(bg, seed=3)
            sign = 1.0 if (self._hash_token(bg, seed=4) % 2 == 0) else -1.0
            vec[idx] += 1.5 * sign

        # 3. Subword character trigrams for morpho-semantic resilience
        for t in tokens:
            if len(t) >= 4:
                for j in range(len(t) - 2):
                    trigram = t[j : j + 3]
                    idx = self._hash_token(trigram, seed=5)
                    sign = 1.0 if (self._hash_token(trigram, seed=6) % 2 == 0) else -1.0
                    vec[idx] += 0.5 * sign

        # L2 Normalization
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            return [round(x / norm, 6) for x in vec]
        return vec
