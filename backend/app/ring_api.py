"""戒指设置页接入层 —— 运行时控制 BLE 戒指（连接/配置手势/测试）。

与 api.md §3-§9 的 6 个核心接口分开，单独一个 /api/v1/ring 子路由，避免污染
对齐文档的主接口集合。所有操作委托给 app.state.ring_manager（后台线程）。
"""

from __future__ import annotations

import asyncio
import json
import logging

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from .config import DEFAULT_CONFIG_PATH
from .envelope import success_body
from .ring_manager import sse_format
from .schemas import (
    ConnectRequest,
    InstrumentSingleMappingBody,
    MappingBody,
    RecognitionRequest,
    RecordStartRequest,
    ScanRequest,
    SingleMappingBody,
    TriggersBody,
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


# ---------------------------------------------------------------------------
# 手势→技法映射
# ---------------------------------------------------------------------------
logger = logging.getLogger(__name__)


def _persist_mapping(mapping: dict[str, str]) -> None:
    try:
        raw = json.loads(DEFAULT_CONFIG_PATH.read_text(encoding="utf-8"))
        raw.setdefault("gesture", {})["mapping"] = mapping
        DEFAULT_CONFIG_PATH.write_text(
            json.dumps(raw, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
    except Exception as exc:
        logger.warning("持久化映射失败: %s", exc)


def _persist_instrument_mapping(inst_mapping: dict[str, dict[str, str]]) -> None:
    try:
        raw = json.loads(DEFAULT_CONFIG_PATH.read_text(encoding="utf-8"))
        raw.setdefault("gesture", {})["instrumentMapping"] = inst_mapping
        DEFAULT_CONFIG_PATH.write_text(
            json.dumps(raw, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
    except Exception as exc:
        logger.warning("持久化乐器映射失败: %s", exc)


def _persist_triggers(triggers: list[dict]) -> None:
    try:
        raw = json.loads(DEFAULT_CONFIG_PATH.read_text(encoding="utf-8"))
        raw.setdefault("gesture", {})["gestureTriggers"] = triggers
        DEFAULT_CONFIG_PATH.write_text(
            json.dumps(raw, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
    except Exception as exc:
        logger.warning("持久化触发配置失败: %s", exc)


@router.get("/mapping")
async def get_gesture_mapping(request: Request):
    gesture_store = request.app.state.gesture_store
    registry = request.app.state.registry
    return success_body({
        "mapping": gesture_store.get_mapping(),
        "instrumentMapping": gesture_store.get_instrument_mapping(),
        "triggers": gesture_store.get_triggers(),
        "techniques": registry.list(),
    })


@router.put("/mapping")
async def set_gesture_mapping(request: Request, body: MappingBody):
    gesture_store = request.app.state.gesture_store
    registry = request.app.state.registry
    for tech in body.mapping.values():
        if not registry.has(tech):
            return success_body(
                {"error": f"未知技法: {tech}"},
            )
    gesture_store.set_mapping(body.mapping)
    _persist_mapping(body.mapping)
    return success_body({"mapping": gesture_store.get_mapping()})


@router.put("/mapping/{gesture_name}")
async def set_single_mapping(request: Request, gesture_name: str, body: SingleMappingBody):
    gesture_store = request.app.state.gesture_store
    registry = request.app.state.registry
    if body.technique is not None and not registry.has(body.technique):
        return success_body({"error": f"未知技法: {body.technique}"})
    gesture_store.update_mapping(gesture_name, body.technique)
    _persist_mapping(gesture_store.get_mapping())
    return success_body({"mapping": gesture_store.get_mapping()})


# ---------------------------------------------------------------------------
# 乐器专属映射
# ---------------------------------------------------------------------------
@router.put("/mapping/instrument/{instrument}/{gesture_name}")
async def set_instrument_single_mapping(
    request: Request, instrument: str, gesture_name: str, body: InstrumentSingleMappingBody
):
    gesture_store = request.app.state.gesture_store
    registry = request.app.state.registry
    if body.technique is not None and not registry.has(body.technique):
        return success_body({"error": f"未知技法: {body.technique}"})
    gesture_store.update_instrument_mapping(instrument, gesture_name, body.technique)
    _persist_instrument_mapping(gesture_store.get_instrument_mapping())
    return success_body({"instrumentMapping": gesture_store.get_instrument_mapping()})


# ---------------------------------------------------------------------------
# 手势触发发音
# ---------------------------------------------------------------------------
@router.get("/triggers")
async def get_triggers(request: Request):
    gesture_store = request.app.state.gesture_store
    return success_body({"triggers": gesture_store.get_triggers()})


@router.put("/triggers")
async def set_triggers(request: Request, body: TriggersBody):
    gesture_store = request.app.state.gesture_store
    gesture_store.set_triggers([t.model_dump() for t in body.triggers])
    _persist_triggers(gesture_store.get_triggers())
    return success_body({"triggers": gesture_store.get_triggers()})
