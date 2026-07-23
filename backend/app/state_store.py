"""当前状态与历史记录 (backend.md §5.6)。

本期内存存储：当前演奏状态 + 最近 N 条历史（倒序）。
ring 连接状态由 GestureStore 提供，在 API 层合并。
"""

from __future__ import annotations

import threading
from collections import deque


class StateStore:
    def __init__(self, max_size: int = 100):
        self._lock = threading.Lock()
        self._history: deque[dict] = deque(maxlen=max_size)
        self._instrument: dict | None = None
        self._key: str | None = None
        self._note: dict | None = None
        self._technique: dict | None = None
        self._playback: dict = {
            "status": "idle",
            "lastPlayedAt": None,
            "lastEventId": None,
        }

    def record(self, event: dict) -> None:
        """记录一次演奏事件（event 为完整历史项 dict）。"""
        with self._lock:
            self._history.appendleft(event)
            self._instrument = event.get("instrument")
            self._key = event.get("key")
            self._note = event.get("note")
            self._technique = event.get("technique")
            self._playback = {
                "status": event.get("playback", {}).get("status"),
                "lastPlayedAt": event.get("createdAt"),
                "lastEventId": event.get("eventId"),
            }

    def current(self) -> dict:
        """当前状态（不含 ring，ring 由 API 层合并）。"""
        with self._lock:
            return {
                "instrument": self._instrument,
                "key": self._key,
                "note": self._note,
                "technique": self._technique,
                "playback": dict(self._playback),
            }

    def history(self, limit: int = 50) -> list[dict]:
        with self._lock:
            return list(self._history)[:limit]
