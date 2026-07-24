"""戒指设置页接入层 —— 运行时控制 BLE 戒指（连接/配置手势/测试）。

与 api.md §3-§9 的 6 个核心接口分开，单独一个 /api/v1/ring 子路由，避免污染
对齐文档的主接口集合。所有操作委托给 app.state.ring_manager（后台线程）。
"""

from __future__ import annotations

import asyncio

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from .envelope import success_body
from .ring_manager import sse_format
from .schemas import (
    ConnectRequest,
    RecognitionRequest,
    RecordStartRequest,
    ScanRequest,
)

router = APIRouter(prefix="/api/v1/ring")

DEFAULT_SCAN_TIMEOUT_S = 4.0
SSE_HEARTBEAT_S = 15.0


def _manager(request: Request):
    return request.app.state.ring_manager


# ---------------------------------------------------------------------------
# 连接管理
# ---------------------------------------------------------------------------
@router.get("/status")
async def ring_status(request: Request):
    return success_body(_manager(request).status())


@router.post("/scan")
async def ring_scan(request: Request, body: ScanRequest | None = None):
    timeout = (body.timeoutS if body and body.timeoutS else None) or DEFAULT_SCAN_TIMEOUT_S
    manager = _manager(request)
    devices = await asyncio.to_thread(manager.scan, timeout)
    return success_body({"devices": devices})


@router.post("/connect")
async def ring_connect(request: Request, body: ConnectRequest):
    manager = _manager(request)
    data = await asyncio.to_thread(manager.connect, body.address)
    return success_body(data)


@router.post("/disconnect")
async def ring_disconnect(request: Request):
    manager = _manager(request)
    data = await asyncio.to_thread(manager.disconnect)
    return success_body(data)


# ---------------------------------------------------------------------------
# 手势配置
# ---------------------------------------------------------------------------
@router.get("/gestures")
async def ring_gestures(request: Request):
    manager = _manager(request)
    return success_body({"method": manager._method, "gestures": manager.list_gestures()})


@router.post("/gestures/record/start")
async def ring_record_start(request: Request, body: RecordStartRequest):
    manager = _manager(request)
    return success_body(manager.start_recording(body.name, body.reps))


@router.post("/gestures/record/rep/start")
async def ring_record_rep_start(request: Request):
    manager = _manager(request)
    return success_body(manager.rep_start())


@router.post("/gestures/record/rep/stop")
async def ring_record_rep_stop(request: Request):
    manager = _manager(request)
    return success_body(manager.rep_stop())


@router.post("/gestures/record/cancel")
async def ring_record_cancel(request: Request):
    manager = _manager(request)
    return success_body(manager.cancel_recording())


@router.delete("/gestures/{name}")
async def ring_delete_gesture(request: Request, name: str):
    manager = _manager(request)
    data = await asyncio.to_thread(manager.delete_gesture, name)
    return success_body(data)


# ---------------------------------------------------------------------------
# 测试：识别开关 + 实时事件流
# ---------------------------------------------------------------------------
@router.post("/recognition")
async def ring_recognition(request: Request, body: RecognitionRequest):
    manager = _manager(request)
    return success_body(manager.set_recognition(body.enabled))


@router.get("/audio")
async def ring_audio_list(request: Request):
    manager = _manager(request)
    return success_body({"files": manager.list_audio_files()})


@router.get("/events")
async def ring_events(request: Request):
    """SSE 实时事件流：status / imu / event / recognition / recording。"""
    manager = _manager(request)
    loop = asyncio.get_running_loop()
    queue: asyncio.Queue = asyncio.Queue(maxsize=1000)
    token = manager.subscribe(queue, loop)

    async def gen():
        try:
            # 首帧先推一次当前状态，便于前端立即渲染
            yield sse_format({"type": "status", "data": manager.status()})
            while True:
                if await request.is_disconnected():
                    break
                try:
                    item = await asyncio.wait_for(queue.get(), timeout=SSE_HEARTBEAT_S)
                except asyncio.TimeoutError:
                    yield ": ping\n\n"
                    continue
                yield sse_format(item)
        finally:
            manager.unsubscribe(token)

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
