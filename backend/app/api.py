"""API 接入层 —— 6 个接口 (严格对齐 api.md §3-§9)。

统一成功响应用 success_body 包裹；失败通过抛 ApiError，由 main 里的
全局 handler 转成统一失败结构。组件通过 request.app.state 获取。
"""

from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from . import SERVICE_NAME, SERVICE_VERSION
from .constants import INSTRUMENTS, INSTRUMENT_NOTES, KEYS, NOTES
from .envelope import ApiError, iso_now, new_request_id, success_body
from .schemas import PlayRequest, RingGestureRequest, SelectionRequest

SSE_HEARTBEAT_S = 15.0

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


# ---------------------------------------------------------------------------
# 10. 选择同步（乐器/音调切换上报）
# ---------------------------------------------------------------------------
@router.post("/selection")
async def update_selection(request: Request, body: SelectionRequest):
    state_store = request.app.state.state_store
    snapshot = state_store.update_selection(body.instrument, body.key)
    return success_body(snapshot)


@router.get("/selection")
async def get_selection(request: Request):
    state_store = request.app.state.state_store
    return success_body(state_store.selection())


# ---------------------------------------------------------------------------
# 11. SSE 实时事件流
# ---------------------------------------------------------------------------
@router.get("/events")
async def events(request: Request):
    """SSE 推送演奏事件，前端据此实时刷新仪表盘。"""
    state_store = request.app.state.state_store
    gesture_store = request.app.state.gesture_store
    loop = asyncio.get_running_loop()
    queue: asyncio.Queue = asyncio.Queue(maxsize=1000)
    token = state_store.subscribe(queue, loop)

    async def gen():
        try:
            current = state_store.current()
            current["ring"] = gesture_store.snapshot().to_public()
            yield _sse_frame({"type": "state", "data": current})
            yield _sse_frame({"type": "selection", "data": state_store.selection()})
            # 曲谱模式状态
            score_store = request.app.state.score_store
            yield _sse_frame({"type": "score", "data": score_store.active_state()})
            while True:
                if await request.is_disconnected():
                    break
                try:
                    item = await asyncio.wait_for(queue.get(), timeout=SSE_HEARTBEAT_S)
                except asyncio.TimeoutError:
                    yield ": ping\n\n"
                    continue
                yield _sse_frame(item)
        finally:
            state_store.unsubscribe(token)

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


def _sse_frame(item: dict) -> str:
    return f"data: {json.dumps(item, ensure_ascii=False)}\n\n"
