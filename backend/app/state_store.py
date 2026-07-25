"""当前状态与历史记录 (backend.md §5.6)。

本期内存存储：当前演奏状态 + 最近 N 条历史（倒序）。
ring 连接状态由 GestureStore 提供，在 API 层合并。
"""

from __future__ import annotations

import asyncio
import threading
from collections import deque
from typing import Any


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
        self._selection: dict = {"instrument": None, "key": None}
        self._sub_seq: int = 0
        self._subscribers: dict[int, tuple[asyncio.Queue, asyncio.AbstractEventLoop]] = {}

    def subscribe(self, queue: asyncio.Queue, loop: asyncio.AbstractEventLoop) -> int:
        with self._lock:
            self._sub_seq += 1
            token = self._sub_seq
            self._subscribers[token] = (queue, loop)
            return token

    def unsubscribe(self, token: int) -> None:
        with self._lock:
            self._subscribers.pop(token, None)

    def _publish(self, event: dict) -> None:
        with self._lock:
            subs = list(self._subscribers.values())
        for queue, loop in subs:
            try:
                loop.call_soon_threadsafe(self._safe_put, queue, event)
            except RuntimeError:
                pass

    @staticmethod
    def _safe_put(queue: asyncio.Queue, item: Any) -> None:
        try:
            queue.put_nowait(item)
        except asyncio.QueueFull:
            pass

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
        self._publish({"type": "play", "data": event})

    def update_selection(self, instrument: str | None, key: str | None) -> dict:
        """更新手机端当前选择（乐器/音调），广播给 SSE 订阅者。"""
        with self._lock:
            if instrument is not None:
                self._selection["instrument"] = instrument
            if key is not None:
                self._selection["key"] = key
            snapshot = dict(self._selection)
        self._publish({"type": "selection", "data": snapshot})
        return snapshot

    def selection(self) -> dict:
        with self._lock:
            return dict(self._selection)

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
