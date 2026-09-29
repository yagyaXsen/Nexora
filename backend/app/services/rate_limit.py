import time
from collections import deque
from threading import Lock
from typing import Dict, Tuple


class InMemoryRateLimiter:
    """Best-effort flood protection for a single free-tier process.

    It intentionally fails open after a restart; durable, multi-instance rate
    limiting belongs behind a shared store once the product has that budget.

    Keys are often client-influenced (IP headers, emails), so idle keys are
    evicted periodically — otherwise every distinct key ever seen stays in
    memory for the life of the process.
    """

    SWEEP_EVERY = 1000  # calls between sweeps of idle keys

    def __init__(self) -> None:
        self._hits: Dict[str, deque] = {}
        self._lock = Lock()
        self._calls = 0
        self._max_window = 0.0

    def hit(self, key: str, limit: int, window_seconds: float) -> Tuple[bool, int]:
        """Record one request for `key`. Returns (allowed, remaining)."""
        now = time.monotonic()
        with self._lock:
            self._max_window = max(self._max_window, window_seconds)
            self._calls += 1
            if self._calls % self.SWEEP_EVERY == 0:
                self._evict_idle(now)

            hits = self._hits.setdefault(key, deque())
            while hits and hits[0] <= now - window_seconds:
                hits.popleft()
            if len(hits) >= limit:
                return False, 0
            hits.append(now)
            return True, limit - len(hits)

    def allow(self, key: str, limit: int, window_seconds: float) -> bool:
        return self.hit(key, limit, window_seconds)[0]

    def _evict_idle(self, now: float) -> None:
        cutoff = now - self._max_window
        for key in [k for k, hits in self._hits.items() if not hits or hits[-1] <= cutoff]:
            del self._hits[key]

    def __len__(self) -> int:
        return len(self._hits)


def client_ip(request) -> str:
    """The caller's IP for rate limiting: the first X-Forwarded-For entry when
    a proxy supplied one, else the socket peer. Clients can forge that header,
    so this is flood protection, not identity."""
    forwarded = request.headers.get("x-forwarded-for", "")
    first = forwarded.split(",")[0].strip()
    if first:
        return first[:64]
    return (request.client.host if request.client else "") or "unknown"


password_reset_limiter = InMemoryRateLimiter()
