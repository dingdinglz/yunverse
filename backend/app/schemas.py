"""请求体模型 (Pydantic)。

响应体统一在 api/orchestrator 中按 api.md 结构组装为 dict，
因此这里只定义请求模型。语义/枚举校验在业务层完成，以便返回
api.md 约定的 INVALID_PARAMETER 结构（含 field/value/allowedValues）。
"""

from __future__ import annotations

from pydantic import BaseModel


class PlayRequest(BaseModel):
    instrument: str
    key: str
    note: str


class RingGestureRequest(BaseModel):
    deviceId: str
    gestureCode: str
    timestamp: str
    confidence: float | None = None
