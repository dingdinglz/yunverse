"""无界面戒指 BLE 后台 worker (backend.md §5.3 / §7.2)。

改编自 advx/ring_gui.py：在独立后台线程跑 asyncio loop，连接戒指、
开启 IMU 上报、用 vendor 的 GestureRecognizer 实时识别手势，命中后
写入共享 GestureStore。默认由 config `ring.enabled` 控制；关闭时后端
照常运行，技法恒为 normal。

依赖真机 + bleak；vendor 代码使用扁平 import，故需把 vendor/ 与
vendor/ring_sound_SDK/ 加入 sys.path。所有 import 延迟到线程内，避免
无硬件环境下导入即失败。
"""

from __future__ import annotations

import asyncio
import logging
import sys
import threading
from pathlib import Path

from .envelope import iso_now
from .gesture import GestureStore

logger = logging.getLogger(__name__)

VENDOR_DIR = Path(__file__).resolve().parent.parent / "vendor"


class RingWorker:
    def __init__(
        self,
        gesture_store: GestureStore,
        address: str,
        vendor_dir: Path = VENDOR_DIR,
        reconnect_delay: float = 2.0,
    ):
        self._gesture = gesture_store
        self._address = address
        self._vendor_dir = Path(vendor_dir)
        self._reconnect_delay = reconnect_delay
        self._running = False
        self._thread: threading.Thread | None = None
        self._loop: asyncio.AbstractEventLoop | None = None

    # -- 生命周期 ---------------------------------------------------------
    def start(self) -> None:
        if not self._address:
            logger.warning("戒指 worker 未配置 address，跳过启动")
            return
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._run, name="ring-worker", daemon=True)
        self._thread.start()
        logger.info("戒指 worker 已启动 (address=%s)", self._address)

    def stop(self) -> None:
        self._running = False
        loop = self._loop
        if loop is not None and loop.is_running():
            loop.call_soon_threadsafe(loop.stop)
        thread = self._thread
        if thread is not None:
            thread.join(timeout=3.0)
        logger.info("戒指 worker 已停止")

    # -- 线程主体 ---------------------------------------------------------
    def _run(self) -> None:
        try:
            sdk, recognizer = self._setup_vendor()
        except Exception as exc:  # 导入或模板加载失败：worker 退出，不影响主服务
            logger.error("戒指 worker 初始化失败: %s", exc)
            self._running = False
            return

        self._loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._loop)
        try:
            self._loop.run_until_complete(self._connect_loop(sdk, recognizer))
        except Exception as exc:
            logger.error("戒指 worker 异常退出: %s", exc)
        finally:
            self._gesture.set_disconnected()
            self._loop.close()
            self._loop = None

    def _setup_vendor(self):
        for p in (str(self._vendor_dir), str(self._vendor_dir / "ring_sound_SDK")):
            if p not in sys.path:
                sys.path.insert(0, p)
        import gesture_engine as ge  # noqa: E402
        import gesture_store as gs  # noqa: E402
        import ring_sound as sdk  # noqa: E402

        gs.GESTURES_DIR = self._vendor_dir / "gestures"
        recognizer = ge.GestureRecognizer()
        for template in gs.load_all_gestures().values():
            recognizer.add_template(template)
        recognizer.enabled = True
        logger.info("已加载 %d 个手势模板", len(recognizer.templates))
        return sdk, recognizer

    async def _connect_loop(self, sdk, recognizer) -> None:
        while self._running:
            try:
                async with sdk.RingSoundClient(address=self._address) as ring:
                    self._gesture.mark_connected(self._address, iso_now())
                    await self._stream(sdk, recognizer, ring)
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.warning("戒指连接中断: %s", exc)
            finally:
                self._gesture.set_disconnected()
            if not self._running:
                break
            await asyncio.sleep(self._reconnect_delay)

    async def _stream(self, sdk, recognizer, ring) -> None:
        # 尝试进入手势模式（设备默认录音模式，error_code=2 表示需单击切换）
        try:
            await sdk.start_sensor_report(ring)
        except sdk.DeviceError as exc:
            if getattr(exc, "error_code", None) == 2:
                logger.info("戒指处于录音模式，请单击按键进入手势模式")
                await asyncio.sleep(2.0)
                return
            raise

        recognizer.segmenter.reset()
        try:
            while self._running and ring.is_connected:
                try:
                    batch = await sdk.wait_sensor_data(ring, timeout_s=5.0)
                except sdk.TimeoutError:
                    continue
                samples = [
                    [s.accel_x, s.accel_y, s.accel_z, s.gyro_x, s.gyro_y, s.gyro_z]
                    for s in batch.samples
                ]
                hit = recognizer.feed(samples)
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
                    logger.info("识别手势: %s (%.0f%%)", name, confidence * 100)
        finally:
            try:
                await sdk.stop_sensor_report(ring)
            except Exception:
                pass
