import asyncio
from typing import Any, Callable, Dict, List
import logging

logger = logging.getLogger("nexora.events")

class EventBus:
    _subscribers: Dict[str, List[Callable]] = {}

    @classmethod
    def subscribe(cls, event_type: str, handler: Callable):
        if event_type not in cls._subscribers:
            cls._subscribers[event_type] = []
        cls._subscribers[event_type].append(handler)
        logger.info(f"Subscribed handler '{handler.__name__}' to event '{event_type}'")

    @classmethod
    async def publish(cls, event_type: str, payload: Dict[str, Any]):
        logger.info(f"Publishing event '{event_type}' with payload: {payload}")
        handlers = cls._subscribers.get(event_type, [])
        for handler in handlers:
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(payload)
                else:
                    handler(payload)
            except Exception as e:
                logger.error(f"Error executing event handler '{handler.__name__}' for '{event_type}': {e}")

# Global Event Bus Instance
event_bus = EventBus()
