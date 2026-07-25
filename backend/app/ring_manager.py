"""戒指 BLE 运行时管理器 (backend.md §5.3 / §7.2)。

在独立后台线程跑一个常驻 asyncio loop，独占一个 RingSoundClient。
FastAPI handler 通过 asyncio.run_coroutine_threadsafe(...).result() 线程安全
地驱动扫描/连接/断开/录制等操作；识别结果写入共享 GestureStore，实时事件
（IMU / 按键 / HMM 手势 / 自定义识别 / 录制进度 / 连接态）通过 SSE 订阅推送。

相较 ring_worker.py 的一次性连接，这里支持运行时按需扫描、连接任意地址、
手动逐次录制手势、以及给设置页做实时测试。

依赖真机 + bleak + numpy；vendor 代码使用扁平 import，故需把 vendor/ 与
vendor/ring_sound_SDK/ 加入 sys.path。所有 vendor import 延迟到首次使用，
保证无硬件/无 bleak 环境下 import 本模块不失败（列手势仅需 numpy）。
"""

from __future__ import annotations

import asyncio
import json
import logging
import sys
import threading
from concurrent.futures import TimeoutError as FutureTimeout
from pathlib import Path
from typing import Any, Callable

from .envelope import ApiError, iso_now
from .gesture import GestureStore

logger = logging.getLogger(__name__)

VENDOR_DIR = Path(__file__).resolve().parent.parent / "vendor"

# 一次录制的每一次动作至少需要的样本数（照搬 ring_gui 的下限）
MIN_REP_SAMPLES = 5
MIN_SEGMENT_SAMPLES = 10


def _system_info_dict(info: Any) -> dict:
    return {
        "firmwareVersion": info.firmware_version,
        "model": info.model,
        "sn": info.sn,
        "cpuid": info.cpuid,
        "batteryPercent": info.battery_percent,
        "batteryCharging": info.battery_charging,
        "audioStorageTotal": info.audio_storage_total,
        "audioStorageAvailable": info.audio_storage_available,
        "systemTime": info.system_time,
    }


class RingManager:
    def __init__(
        self,
        gesture_store: GestureStore,
        vendor_dir: Path = VENDOR_DIR,
        gesture_config: Any = None,
        state_store: Any = None,
        voice_agent: Any = None,
        orchestrator: Any = None,
    ):
        self._gesture = gesture_store
        self._vendor_dir = Path(vendor_dir)
        self._gesture_config = gesture_config
        self._state_store = state_store
        self._voice_agent = voice_agent
        self._orchestrator = orchestrator

        self._lock = threading.Lock()
        self._loop: asyncio.AbstractEventLoop | None = None
        self._thread: threading.Thread | None = None

        # vendor 模块与识别器（延迟加载）
        self._sdk: Any = None
        self._ge: Any = None
        self._gs: Any = None
        self._np: Any = None
        self._recognizer: Any = None

        # 连接与设备状态
        self._client: Any = None
        self._conn_state = "disconnected"  # disconnected / connecting / connected
        self._address: str | None = None
        self._device_info: dict | None = None
        self._mode: str | None = None  # gesture / recording / None
        self._recognition_enabled = True
        self._stream_tasks: list[asyncio.Task] = []

        # 录音文件
        self._audio_files: list[dict] = []  # [{index, path, size, name}]

        # 录制会话（手动逐次）
        self._rec: dict | None = None

        # SSE 订阅者：{token: (queue, loop)}
        self._subscribers: dict[int, tuple[asyncio.Queue, asyncio.AbstractEventLoop]] = {}
        self._sub_seq = 0

    # ------------------------------------------------------------------ #
    # 线程 / loop / vendor 初始化
    # ------------------------------------------------------------------ #
    def _ensure_loop(self) -> asyncio.AbstractEventLoop:
        with self._lock:
            if self._loop is not None and self._loop.is_running():
                return self._loop
            self._loop = asyncio.new_event_loop()
            self._thread = threading.Thread(
                target=self._loop.run_forever, name="ring-manager", daemon=True
            )
            self._thread.start()
            logger.info("戒指管理器事件循环已启动")
            return self._loop

    def _ensure_gestures(self) -> None:
        """根据配置加载 DTW 或 HMM 识别器。"""
        if self._recognizer is not None:
            return
        for p in (str(self._vendor_dir), str(self._vendor_dir / "ring_sound_SDK")):
            if p not in sys.path:
                sys.path.insert(0, p)
        try:
            import numpy as np  # noqa: E402
            import gesture_engine as ge  # noqa: E402
            import gesture_store as gs  # noqa: E402
        except Exception as exc:  # pragma: no cover - 环境缺依赖
            raise ApiError("RING_UNAVAILABLE", f"手势依赖不可用: {exc}")
        gs.GESTURES_DIR = self._vendor_dir / "gestures"
        self._np, self._ge, self._gs = np, ge, gs

        method = "dtw"
        if self._gesture_config is not None:
            method = getattr(self._gesture_config, "method", "dtw")

        if method == "hmm":
            self._recognizer = self._create_hmm_recognizer()
        else:
            recognizer = ge.GestureRecognizer()
            for template in gs.load_all_gestures().values():
                recognizer.add_template(template)
            recognizer.enabled = self._recognition_enabled
            self._recognizer = recognizer

        logger.info("识别方法=%s, 模板/模型数=%d", method, len(self._recognizer.templates))

    def _create_hmm_recognizer(self):
        from signal_filter import SignalFilter
        from feature_extractor import FeatureExtractor
        from hmm_engine import HMMRecognizer

        cfg = self._gesture_config
        filter_cfg = getattr(cfg, "filter", None)
        hmm_cfg = getattr(cfg, "hmm", None)

        sf = SignalFilter(
            sample_rate=getattr(filter_cfg, "sampleRate", 25.0) if filter_cfg else 25.0,
            cutoff_hz=getattr(filter_cfg, "cutoffHz", 10.0) if filter_cfg else 10.0,
            order=getattr(filter_cfg, "order", 2) if filter_cfg else 2,
            median_kernel=getattr(filter_cfg, "medianKernel", 5) if filter_cfg else 5,
        )
        fe = FeatureExtractor(
            window_size=getattr(hmm_cfg, "windowSize", 8) if hmm_cfg else 8,
            overlap=getattr(hmm_cfg, "windowOverlap", 4) if hmm_cfg else 4,
        )
        model_dir = self._vendor_dir / (getattr(hmm_cfg, "modelDir", "models") if hmm_cfg else "models")
        if not model_dir.is_absolute():
            model_dir = self._vendor_dir.parent / getattr(hmm_cfg, "modelDir", "vendor/models")

        recognizer = HMMRecognizer(
            model_dir=model_dir,
            signal_filter=sf,
            feature_extractor=fe,
            min_confidence=getattr(cfg, "minConfidence", 0.0),
        )
        recognizer.enabled = self._recognition_enabled
        return recognizer

    def _ensure_vendor(self) -> None:
        """加载完整 SDK（含 bleak）。仅在扫描/连接等需要真机时调用。"""
        self._ensure_gestures()
        if self._sdk is not None:
            return
        try:
            import ring_sound as sdk  # noqa: E402
        except Exception as exc:  # pragma: no cover - 环境缺 bleak
            raise ApiError("RING_UNAVAILABLE", f"戒指 SDK 不可用: {exc}")
        self._sdk = sdk

    def _run(self, coro, timeout: float = 20.0):
        loop = self._ensure_loop()
        fut = asyncio.run_coroutine_threadsafe(coro, loop)
        try:
            return fut.result(timeout)
        except FutureTimeout:
            fut.cancel()
            raise ApiError("RING_BUSY", "戒指操作超时，请重试")

    # ------------------------------------------------------------------ #
    # SSE 订阅
    # ------------------------------------------------------------------ #
    def subscribe(self, queue: asyncio.Queue, loop: asyncio.AbstractEventLoop) -> int:
        with self._lock:
            self._sub_seq += 1
            token = self._sub_seq
            self._subscribers[token] = (queue, loop)
            return token

    def unsubscribe(self, token: int) -> None:
        with self._lock:
            self._subscribers.pop(token, None)

    def _publish(self, event_type: str, data: Any) -> None:
        """把事件推给所有订阅者（跨线程安全：投递到各自的事件循环）。"""
        item = {"type": event_type, "data": data, "at": iso_now()}
        with self._lock:
            subs = list(self._subscribers.values())
        for queue, loop in subs:
            try:
                loop.call_soon_threadsafe(self._safe_put, queue, item)
            except RuntimeError:
                # 订阅端 loop 已关闭，忽略
                pass

    @staticmethod
    def _safe_put(queue: asyncio.Queue, item: dict) -> None:
        try:
            queue.put_nowait(item)
        except asyncio.QueueFull:
            pass

    def _publish_status(self) -> None:
        self._publish("status", self.status())

    # ------------------------------------------------------------------ #
    # 公开只读状态
    # ------------------------------------------------------------------ #
    def status(self) -> dict:
        gesture_count = 0
        try:
            self._ensure_gestures()
            gesture_count = len(self._recognizer.templates)
        except ApiError:
            gesture_count = 0
        return {
            "connection": self._conn_state,
            "address": self._address,
            "mode": self._mode,
            "deviceInfo": self._device_info,
            "recognitionEnabled": self._recognition_enabled,
            "recording": self._recording_dict(),
            "gestureCount": gesture_count,
        }

    @property
    def _method(self) -> str:
        if self._gesture_config is not None:
            return getattr(self._gesture_config, "method", "dtw")
        return "dtw"

    def list_gestures(self) -> list[dict]:
        self._ensure_gestures()
        method = self._method
        result = []
        for name, t in self._recognizer.templates.items():
            if method == "hmm":
                result.append({"name": name, "type": "hmm"})
            else:
                result.append({
                    "name": name,
                    "type": "dtw",
                    "sampleCount": len(t.repetitions),
                    "threshold": float(t.threshold),
                })
        return result

    def delete_gesture(self, name: str) -> dict:
        self._ensure_gestures()
        if self._method == "hmm":
            raise ApiError("INVALID_OPERATION", "HMM 模式下不支持删除手势模型")
        ok = self._gs.delete_gesture(name)
        if not ok:
            raise ApiError("GESTURE_NOT_FOUND", f"手势不存在: {name}")
        self._recognizer.remove_template(name)
        return {"deleted": name}

    def set_recognition(self, enabled: bool) -> dict:
        self._recognition_enabled = bool(enabled)
        if self._recognizer is not None:
            self._recognizer.enabled = bool(enabled)
        self._publish_status()
        return {"recognitionEnabled": self._recognition_enabled}

    def _recording_dict(self, message: str | None = None) -> dict | None:
        rec = self._rec
        if rec is None:
            return None
        out = {
            "name": rec["name"],
            "targetReps": rec["target"],
            "currentRep": rec["current"],
            "active": rec["active"],
        }
        if message:
            out["message"] = message
        return out

    # ------------------------------------------------------------------ #
    # 扫描 / 连接 / 断开（异步实现，经 _run 调用）
    # ------------------------------------------------------------------ #
    def scan(self, timeout_s: float = 4.0) -> list[dict]:
        return self._run(self._scan(timeout_s), timeout=timeout_s + 15.0)

    async def _scan(self, timeout_s: float) -> list[dict]:
        self._ensure_vendor()
        devices = await self._sdk.scan_rings(timeout_s=timeout_s)
        rings = [d for d in devices if d.name and "ring" in d.name.lower()]
        return [
            {"address": d.address, "name": d.name, "rssi": d.rssi} for d in rings
        ]

    def connect(self, address: str) -> dict:
        if not address or not address.strip():
            raise ApiError(
                "INVALID_PARAMETER",
                "address 不能为空",
                {"field": "address", "value": address},
            )
        return self._run(self._connect(address.strip()), timeout=35.0)

    async def _connect(self, address: str) -> dict:
        if self._conn_state == "connected" and self._address == address:
            return self.status()
        if self._client is not None:
            await self._disconnect()

        self._ensure_vendor()
        self._conn_state = "connecting"
        self._address = address
        self._publish_status()

        try:
            client = self._sdk.RingSoundClient(address=address)
            await client.connect()
        except Exception as exc:
            self._conn_state = "disconnected"
            self._publish_status()
            raise ApiError("RING_UNAVAILABLE", f"连接戒指失败: {exc}")

        self._client = client
        try:
            self._sdk.enable_time_sync(client)
        except Exception:
            pass

        self._conn_state = "connected"
        self._gesture.mark_connected(address, iso_now())

        try:
            info = await self._sdk.get_system_info(client)
            self._device_info = _system_info_dict(info)
        except Exception as exc:
            logger.warning("获取设备信息失败: %s", exc)
            self._device_info = None

        self._recognizer.segmenter.reset()
        self._stream_tasks = [
            asyncio.ensure_future(self._stream()),
            asyncio.ensure_future(self._listen_events()),
            asyncio.ensure_future(self._audio_listener()),
        ]
        self._publish_status()
        return self.status()

    def disconnect(self) -> dict:
        if self._loop is None or not self._loop.is_running():
            return self.status()
        return self._run(self._disconnect(), timeout=10.0)

    async def _disconnect(self) -> dict:
        self._conn_state = "disconnected"
        for t in self._stream_tasks:
            if not t.done():
                t.cancel()
        self._stream_tasks = []
        if self._client is not None:
            try:
                await self._client.disconnect()
            except Exception:
                pass
        self._client = None
        self._mode = None
        self._device_info = None
        self._rec = None
        self._gesture.set_disconnected()
        self._publish_status()
        return self.status()

    # ------------------------------------------------------------------ #
    # IMU 流 + 事件监听（运行在管理器 loop 上）
    # ------------------------------------------------------------------ #
    async def _stream(self) -> None:
        sdk = self._sdk
        retry_count = 0
        max_retries = 3
        while self._conn_state == "connected" and self._client and self._client.is_connected:
            try:
                await sdk.start_sensor_report(self._client)
                retry_count = 0
            except sdk.DeviceError as exc:
                if getattr(exc, "error_code", None) == 2:
                    self._mode = "recording"
                    self._publish("event", {"kind": "info", "message": "戒指处于录音模式，请单击按键进入手势模式"})
                    self._publish_status()
                    await asyncio.sleep(2.0)
                    continue
                retry_count += 1
                self._publish("event", {"kind": "error", "message": f"IMU 启动失败(error={getattr(exc, 'error_code', '?')})，重试 {retry_count}/{max_retries}"})
                if retry_count > max_retries:
                    self._publish("event", {"kind": "error", "message": "IMU 重启失败，尝试重新连接..."})
                    asyncio.ensure_future(self._reconnect())
                    return
                await asyncio.sleep(1.5)
                continue
            except sdk.TimeoutError:
                retry_count += 1
                self._publish("event", {"kind": "error", "message": f"IMU 启动超时，重试 {retry_count}/{max_retries}"})
                if retry_count > max_retries:
                    self._publish("event", {"kind": "error", "message": "IMU 重启失败，尝试重新连接..."})
                    asyncio.ensure_future(self._reconnect())
                    return
                await asyncio.sleep(1.0)
                continue
            except asyncio.CancelledError:
                break
            except Exception as exc:
                self._publish("event", {"kind": "error", "message": f"IMU 异常: {exc}，尝试重新连接..."})
                asyncio.ensure_future(self._reconnect())
                return

            self._mode = "gesture"
            self._publish("event", {"kind": "info", "message": "IMU 已启动"})
            self._publish_status()
            try:
                while self._conn_state == "connected" and self._client and self._client.is_connected:
                    try:
                        batch = await sdk.wait_sensor_data(self._client, timeout_s=5.0)
                    except sdk.TimeoutError:
                        continue
                    except sdk.RingSoundError as exc:
                        self._publish("event", {"kind": "error", "message": f"IMU 数据中断: {exc}"})
                        break
                    self._handle_batch(batch)
            except asyncio.CancelledError:
                break
            finally:
                try:
                    await sdk.stop_sensor_report(self._client)
                except Exception:
                    pass
            if self._conn_state != "connected":
                break
            self._publish("event", {"kind": "info", "message": "IMU 已停止，尝试重新启动..."})
            retry_count += 1
            if retry_count > max_retries:
                self._publish("event", {"kind": "error", "message": "IMU 重启失败，尝试重新连接..."})
                asyncio.ensure_future(self._reconnect())
                return
            await asyncio.sleep(1.0)

    async def _reconnect(self) -> None:
        if not self._client:
            return
        address = self._address
        self._conn_state = "reconnecting"
        self._publish("event", {"kind": "info", "message": "正在重新连接..."})
        self._publish_status()
        try:
            for t in self._stream_tasks:
                if not t.done():
                    t.cancel()
            self._stream_tasks = []
            try:
                await self._client.disconnect()
            except Exception:
                pass
            self._client = None
            await asyncio.sleep(1.0)
            if address:
                await self._connect(address)
        except Exception as exc:
            self._publish("event", {"kind": "error", "message": f"重新连接失败: {exc}"})
            self._conn_state = "disconnected"
            self._publish_status()

    def _handle_batch(self, batch: Any) -> None:
        samples = [
            [s.accel_x, s.accel_y, s.accel_z, s.gyro_x, s.gyro_y, s.gyro_z]
            for s in batch.samples
        ]
        if samples:
            self._publish("imu", {"samples": samples, "count": len(samples)})

        rec = self._rec
        if rec is not None and rec["active"]:
            rec["buffer"].extend(samples)
            return

        if self._recognition_enabled and self._recognizer is not None:
            hit = self._recognizer.feed(samples)
            if hit:
                name, confidence = hit
                now = iso_now()
                self._gesture.update(
                    device_id=self._address,
                    gesture_code=name,
                    confidence=float(confidence),
                    timestamp=now,
                    updated_at=now,
                    connected=True,
                )
                self._publish("recognition", {"name": name, "confidence": float(confidence)})

                trigger = self._gesture.find_trigger(name)
                if trigger and self._orchestrator is not None:
                    loop = self._loop
                    if loop:
                        asyncio.run_coroutine_threadsafe(
                            self._auto_play(trigger), loop
                        )
                elif self._state_store is not None:
                    current_instrument = None
                    if self._state_store:
                        sel = self._state_store.selection()
                        current_instrument = sel.get("instrument")
                    technique = self._gesture.resolve_technique_for(name, instrument=current_instrument)
                    self._state_store._publish({"type": "technique", "data": technique})

    async def _auto_play(self, trigger: dict) -> None:
        try:
            data = await self._orchestrator.play(
                trigger["instrument"], trigger["key"], trigger["note"]
            )
            self._publish("event", {
                "kind": "gesture_play",
                "gesture": trigger["gesture"],
                "instrument": trigger["instrument"],
                "note": trigger["note"],
            })
        except Exception as exc:
            logger.warning("手势触发发音失败: %s", exc)
            self._publish("event", {"kind": "error", "message": f"手势触发发音失败: {exc}"})

    async def _listen_events(self) -> None:
        sdk = self._sdk
        await asyncio.gather(
            self._listen_key_single(),
            self._listen(sdk.wait_sensor_double_tap_event, "double_tap"),
            self._listen_hmm_gesture(),
            return_exceptions=True,
        )

    async def _listen_key_single(self) -> None:
        sdk = self._sdk
        while self._conn_state == "connected" and self._client:
            try:
                ev = await sdk.wait_sensor_key_single_press_event(self._client, timeout_s=60.0)
            except sdk.TimeoutError:
                continue
            except asyncio.CancelledError:
                break
            except Exception:
                break
            self._publish("event", {"kind": "key_single", "ts": getattr(ev, "timestamp_ms", None)})
            self._toggle_mode()

    async def _listen(self, waiter: Callable, kind: str) -> None:
        while self._conn_state == "connected" and self._client:
            try:
                ev = await waiter(self._client, timeout_s=60.0)
            except self._sdk.TimeoutError:
                continue
            except asyncio.CancelledError:
                break
            except Exception:
                break
            self._publish("event", {"kind": kind, "ts": getattr(ev, "timestamp_ms", None)})

    async def _listen_hmm_gesture(self) -> None:
        sdk = self._sdk
        while self._conn_state == "connected" and self._client:
            try:
                ev = await sdk.wait_sensor_gesture_event(self._client, timeout_s=60.0)
            except sdk.TimeoutError:
                continue
            except asyncio.CancelledError:
                break
            except Exception:
                break
            self._publish(
                "event",
                {
                    "kind": "hmm_gesture",
                    "gestureId": ev.gesture_id,
                    "name": sdk.sensor_gesture_name(ev.gesture_id),
                    "ts": ev.timestamp_ms,
                },
            )

    def _toggle_mode(self) -> None:
        """按键单击切换模式：停止当前 IMU stream，切换 mode，重启 stream。"""
        if self._mode == "gesture":
            self._mode = "recording"
            self._publish("event", {"kind": "info", "message": "切换到录音模式"})
            # 取消 IMU stream task，让它停掉
            for t in self._stream_tasks:
                if t.get_coro().__name__ == "_stream" and not t.done():
                    t.cancel()
                    break
        else:
            self._mode = "gesture"
            self._publish("event", {"kind": "info", "message": "切换到手势模式，重启 IMU..."})
            # 重启 IMU stream task
            has_stream = any(
                not t.done() and t.get_coro().__name__ == "_stream"
                for t in self._stream_tasks
            )
            if not has_stream:
                new_task = asyncio.ensure_future(self._stream())
                self._stream_tasks.append(new_task)
        self._publish_status()

    # ------------------------------------------------------------------ #
    # 录音监听（运行在管理器 loop 上，录音模式下自动接收音频文件）
    # ------------------------------------------------------------------ #
    async def _audio_listener(self) -> None:
        sdk = self._sdk
        retry_count = 0
        max_retries = 3
        while self._conn_state == "connected" and self._client and self._client.is_connected:
            if self._mode == "gesture":
                await asyncio.sleep(1.0)
                continue
            try:
                self._publish("event", {"kind": "info", "message": "录音监听: 等待录音完成..."})
                file_index, raw_audio = await sdk.receive_auto_audio_file(
                    self._client, timeout_s=120.0
                )
                retry_count = 0
                size_kb = len(raw_audio) / 1024
                self._publish("event", {"kind": "info", "message": f"录音接收完成: index={file_index} size={size_kb:.1f}KB"})

                output_dir = self._vendor_dir / "audio"
                output_dir.mkdir(exist_ok=True)
                try:
                    bundle = sdk.save_audio_bundle(
                        file_index=file_index,
                        data=raw_audio,
                        output_dir=str(output_dir),
                    )
                    entry = {
                        "index": file_index,
                        "path": str(bundle.play_path),
                        "name": bundle.play_file_name,
                        "size": bundle.play_size,
                    }
                    self._audio_files.append(entry)
                    self._publish("audio", {"state": "received", **entry})
                    self._publish("event", {"kind": "info", "message": f"录音已保存: {bundle.play_file_name}"})
                    # 语音指令处理：非手动录制会话时，将录音交给 VoiceAgent
                    if self._voice_agent is not None and self._rec is None:
                        asyncio.ensure_future(self._process_voice_command(entry["path"]))
                except Exception as e:
                    raw_path = output_dir / f"recording_{file_index}.bin"
                    raw_path.write_bytes(raw_audio)
                    entry = {
                        "index": file_index,
                        "path": str(raw_path),
                        "name": raw_path.name,
                        "size": len(raw_audio),
                    }
                    self._audio_files.append(entry)
                    self._publish("audio", {"state": "raw", **entry})
                    self._publish("event", {"kind": "warn", "message": f"录音解码失败: {e}"})

            except sdk.TimeoutError:
                continue
            except asyncio.CancelledError:
                break
            except Exception as e:
                if self._conn_state != "connected" or self._mode == "gesture":
                    continue
                retry_count += 1
                self._publish("event", {"kind": "error", "message": f"录音监听异常: {e}，重试 {retry_count}/{max_retries}"})
                if retry_count > max_retries:
                    self._publish("event", {"kind": "error", "message": "录音监听重试失败"})
                    return
                await asyncio.sleep(2.0)

    def list_audio_files(self) -> list[dict]:
        return list(self._audio_files)

    # ------------------------------------------------------------------ #
    # 语音指令处理
    # ------------------------------------------------------------------ #
    async def _process_voice_command(self, audio_path: str) -> None:
        """将接收到的录音交给 VoiceAgent 进行语音指令识别与乐器切换。"""
        try:
            result = await self._voice_agent.process_voice_command(
                audio_path, self._state_store, self._publish
            )
            if result and result.get("switched"):
                self._publish("event", {
                    "kind": "info",
                    "message": f"语音切换乐器: {result['instrument']} (识别: {result.get('text', '')})",
                })
            elif result:
                self._publish("event", {
                    "kind": "warn",
                    "message": f"语音未匹配指令: {result.get('text', '')}",
                })
        except Exception as e:
            logger.error("语音指令处理异常: %s", e)
            self._publish("voice", {"state": "error", "message": str(e)})

    # ------------------------------------------------------------------ #
    # 手动逐次录制
    # ------------------------------------------------------------------ #
    def _require_connected(self) -> None:
        if self._conn_state != "connected" or self._client is None:
            raise ApiError("RING_NOT_CONNECTED", "戒指未连接")

    def start_recording(self, name: str, reps: int) -> dict:
        if self._method == "hmm":
            raise ApiError("INVALID_OPERATION", "HMM 模式下不支持录制手势")
        name = (name or "").strip()
        if not name:
            raise ApiError("INVALID_PARAMETER", "手势名称不能为空", {"field": "name"})
        if reps < 2 or reps > 20:
            raise ApiError(
                "INVALID_PARAMETER",
                "重复次数需在 2 到 20 之间",
                {"field": "reps", "value": reps},
            )
        return self._do_start_recording(name, reps)

    def _do_start_recording(self, name: str, reps: int) -> dict:
        self._require_connected()
        if self._mode != "gesture":
            raise ApiError("RING_BUSY", "戒指不在手势模式，请单击戒指按键切换")
        if self._rec is not None:
            raise ApiError("RECORDING_INVALID", "已有录制进行中")
        self._rec = {
            "name": name,
            "target": reps,
            "current": 0,
            "active": False,
            "buffer": [],
            "reps": [],
        }
        self._publish("recording", {"state": "started", **(self._recording_dict() or {})})
        return {"state": "recording", **(self._recording_dict() or {})}

    def rep_start(self) -> dict:
        self._require_connected()
        rec = self._rec
        if rec is None:
            raise ApiError("RECORDING_INVALID", "没有进行中的录制")
        if rec["active"]:
            raise ApiError("RECORDING_INVALID", "本次录制已在进行")
        rec["active"] = True
        rec["buffer"] = []
        self._publish("recording", {"state": "rep_recording", **(self._recording_dict() or {})})
        return {"state": "rep_recording", **(self._recording_dict() or {})}

    def rep_stop(self) -> dict:
        self._require_connected()
        rec = self._rec
        if rec is None or not rec["active"]:
            raise ApiError("RECORDING_INVALID", "本次录制未开始")
        rec["active"] = False
        buf = rec["buffer"]
        rec["buffer"] = []
        if len(buf) < MIN_REP_SAMPLES:
            msg = "录制太短，请重录本次"
            self._publish("recording", {"state": "rep_too_short", **(self._recording_dict(msg) or {})})
            return {"state": "rep_too_short", **(self._recording_dict(msg) or {})}

        rec["reps"].append(self._np.array(buf, dtype=self._np.int16))
        rec["current"] += 1
        if rec["current"] >= rec["target"]:
            return self._finalize_recording()

        self._publish("recording", {"state": "rep_saved", **(self._recording_dict() or {})})
        return {"state": "rep_saved", **(self._recording_dict() or {})}

    def _finalize_recording(self) -> dict:
        """裁剪每次动作、计算阈值、落盘并热加载（照搬 ring_gui._finalize_recording）。"""
        rec = self._rec
        assert rec is not None
        ge, gs, np = self._ge, self._gs, self._np
        name = rec["name"]

        trimmed: list = []
        for rep in rec["reps"]:
            seg = ge.MotionSegmenter()
            for s in rep[: min(10, len(rep))].tolist():
                seg._update_baseline(np.array(s, dtype=np.float64))
            seg._baseline_initialized = True
            found = None
            for s in rep.tolist():
                result = seg._feed_one(s)
                if result is not None and found is None:
                    found = result
            if found is not None and len(found) >= MIN_SEGMENT_SAMPLES:
                trimmed.append(found)
            else:
                trimmed.append(rep)

        threshold = ge.compute_threshold(trimmed)
        gs.save_gesture(name, trimmed, threshold)
        template = ge.GestureTemplate(name=name, repetitions=trimmed, threshold=threshold)
        self._recognizer.add_template(template)
        self._rec = None

        done = {
            "state": "done",
            "name": name,
            "sampleCount": len(trimmed),
            "threshold": float(threshold),
        }
        self._publish("recording", done)
        self._publish_status()
        return done

    def cancel_recording(self) -> dict:
        self._rec = None
        self._publish("recording", {"state": "cancelled"})
        return {"state": "cancelled"}

    # ------------------------------------------------------------------ #
    # 生命周期（供 lifespan 调用）
    # ------------------------------------------------------------------ #
    def auto_connect(self, address: str) -> None:
        """启动时按配置自动连接（失败仅记日志，不阻断服务）。"""
        try:
            self.connect(address)
        except ApiError as exc:
            logger.warning("自动连接戒指失败: %s", exc.message)

    def shutdown(self) -> None:
        try:
            self.disconnect()
        except Exception:
            pass
        loop = self._loop
        if loop is not None and loop.is_running():
            loop.call_soon_threadsafe(loop.stop)
        thread = self._thread
        if thread is not None:
            thread.join(timeout=3.0)
        logger.info("戒指管理器已停止")


def sse_format(item: dict) -> str:
    """把事件字典序列化为 SSE 帧。"""
    return f"data: {json.dumps(item, ensure_ascii=False)}\n\n"
