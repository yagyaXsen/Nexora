import time
from collections import defaultdict, deque
from threading import Lock


class InMemoryRateLimiter:
    """Best-effort flood protection for a single free-tier process.

    It intentionally fails open after a restart; durable, multi-instance rate
    limiting belongs behind a shared store once the product has that budget.
    """

    def __init__(self) -> None:
        self._hits = defaultdict(deque)
        self._lock = Lock()

    def allow(self, key: str, limit: int, window_seconds: int) -> bool:
        now = time.monotonic()
        with self._lock:
            hits = self._hits[key]
            while hits and hits[0] <= now - window_seconds:
                hits.popleft()
            if len(hits) >= limit:
                return False
            hits.append(now)
            return True


password_reset_limiter = InMemoryRateLimiter()
