"""API 接入层 —— 6 个接口 (严格对齐 api.md §3-§9)。

统一成功响应用 success_body 包裹；失败通过抛 ApiError，由 main 里的
全局 handler 转成统一失败结构。组件通过 request.app.state 获取。
"""

from __future__ import annotations

from fastapi import APIRouter, Request

from . import SERVICE_NAME, SERVICE_VERSION
from .constants import INSTRUMENTS, INSTRUMENT_NOTES, KEYS, NOTES
from .envelope import ApiError, iso_now, new_request_id, success_body
from .schemas import PlayRequest, RingGestureRequest

router = APIRouter(prefix="/api/v1")


# ---------------------------------------------------------------------------
# 4. 健康检查
# ---------------------------------------------------------------------------
@router.get("/health")
async def health():
    return success_body(
        {
            "status": "ok",
            "service": SERVICE_NAME,
            "version": SERVICE_VERSION,
            "time": iso_now(),
        }
    )


# ---------------------------------------------------------------------------
# 5. 枚举配置
# ---------------------------------------------------------------------------
@router.get("/config")
async def get_config(request: Request):
    registry = request.app.state.registry
    return success_body(
        {
            "instruments": [
                {"code": code, "name": name, "enabled": True}
                for code, name in INSTRUMENTS.items()
            ],
            "keys": list(KEYS),
            "notes": [
                {"code": n["code"], "label": n["label"], "degree": n["degree"]}
                for n in NOTES
            ],
            "notesByInstrument": {
                inst: [
                    {"code": n["code"], "label": n["label"], "degree": n["degree"], "register": n["register"]}
                    for n in notes
                ]
                for inst, notes in INSTRUMENT_NOTES.items()
            },
            "techniques": registry.list(),
        }
    )


# ---------------------------------------------------------------------------
# 6. 触发演奏
# ---------------------------------------------------------------------------
@router.post("/play")
async def play(request: Request, body: PlayRequest):
    orchestrator = request.app.state.orchestrator
    data = await orchestrator.play(body.instrument, body.key, body.note, loop=body.loop)
    return success_body(data)


# ---------------------------------------------------------------------------
# 6b. 停止播放
# ---------------------------------------------------------------------------
@router.post("/play/stop")
async def play_stop(request: Request):
    playback: "PlaybackExecutor" = request.app.state.playback
    await playback.stop()
    return success_body({"stopped": True})


# ---------------------------------------------------------------------------
# 7. 当前状态
# ---------------------------------------------------------------------------
@router.get("/state")
async def get_state(request: Request):
    state_store = request.app.state.state_store
    gesture_store = request.app.state.gesture_store
    data = state_store.current()
    data["ring"] = gesture_store.snapshot().to_public()
    return success_body(data)


# ---------------------------------------------------------------------------
# 8. 历史记录
# ---------------------------------------------------------------------------
@router.get("/history")
async def get_history(request: Request, limit: int = 50, cursor: str | None = None):
    if limit < 1:
        limit = 1
    if limit > 100:
        limit = 100
    state_store = request.app.state.state_store
    items = state_store.history(limit=limit)
    return success_body({"items": items, "nextCursor": None})


# ---------------------------------------------------------------------------
# 9. 戒指手势上报
# ---------------------------------------------------------------------------
@router.post("/ring/gesture")
async def ring_gesture(request: Request, body: RingGestureRequest):
    if body.confidence is not None and not (0.0 <= body.confidence <= 1.0):
        raise ApiError(
            "INVALID_PARAMETER",
            "confidence 必须在 0 到 1 之间",
            {"field": "confidence", "value": body.confidence},
        )

    gesture_store = request.app.state.gesture_store
    updated_at = iso_now()
    gesture_store.update(
        device_id=body.deviceId,
        gesture_code=body.gestureCode,
        confidence=body.confidence,
        timestamp=body.timestamp,
        updated_at=updated_at,
        connected=True,
    )
    technique = gesture_store.resolve_technique_for(body.gestureCode)
    return success_body(
        {
            "accepted": True,
            "deviceId": body.deviceId,
            "gestureCode": body.gestureCode,
            "technique": technique,
            "updatedAt": updated_at,
        }
    )
