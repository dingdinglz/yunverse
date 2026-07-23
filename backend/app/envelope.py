"""统一响应封装、requestId/eventId 生成、错误码与异常。

严格对齐 api.md §2.3（响应结构）与 §10（错误码）。
"""

from __future__ import annotations

import itertools
import threading
from datetime import datetime, timedelta, timezone
from typing import Any

# 项目统一使用东八区时间 (api.md §2.4 ISO 8601 带时区)
TZ = timezone(timedelta(hours=8))


def iso_now() -> str:
    """当前东八区时间，形如 2026-07-23T22:43:00+08:00 (秒精度)。"""
    return datetime.now(TZ).isoformat(timespec="seconds")

# ---------------------------------------------------------------------------
# 错误码 -> HTTP 状态码 (api.md §10 / §11)
# ---------------------------------------------------------------------------
ERROR_HTTP_STATUS: dict[str, int] = {
    "INVALID_PARAMETER": 400,
    "AUDIO_NOT_FOUND": 404,
    "PLAYBACK_DEVICE_UNAVAILABLE": 503,
    "PLAYBACK_FAILED": 500,
    "INTERNAL_ERROR": 500,
    "SERVICE_UNAVAILABLE": 503,
    "UNAUTHORIZED": 401,
}


class ApiError(Exception):
    """业务异常，携带错误码/消息/细节，交由全局 handler 转成统一失败响应。"""

    def __init__(self, code: str, message: str, details: dict | None = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.details = details or {}

    @property
    def http_status(self) -> int:
        return ERROR_HTTP_STATUS.get(self.code, 500)


# ---------------------------------------------------------------------------
# ID 生成 —— req_ / evt_ + 时间戳 + 递增序号
# ---------------------------------------------------------------------------
_lock = threading.Lock()
_counter = itertools.count(1)


def _next_seq() -> int:
    with _lock:
        return next(_counter)


def _timestamp_compact(now: datetime | None = None) -> str:
    now = now or datetime.now()
    return now.strftime("%Y%m%d%H%M%S")


def new_request_id() -> str:
    return f"req_{_timestamp_compact()}{_next_seq():03d}"


def new_event_id() -> str:
    return f"evt_{_timestamp_compact()}{_next_seq():03d}"


# ---------------------------------------------------------------------------
# 响应体构造
# ---------------------------------------------------------------------------
def success_body(data: Any, request_id: str | None = None) -> dict:
    return {
        "success": True,
        "data": data,
        "requestId": request_id or new_request_id(),
    }


def error_body(
    code: str,
    message: str,
    details: dict | None = None,
    request_id: str | None = None,
) -> dict:
    error: dict[str, Any] = {"code": code, "message": message}
    if details:
        error["details"] = details
    return {
        "success": False,
        "error": error,
        "requestId": request_id or new_request_id(),
    }
