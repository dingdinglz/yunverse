"""播放执行模块 (backend.md §5.5 / §10)。

设计：同步确认、异步播放。submit() 只把任务放入串行队列即返回，
真正的 WAV 播放由后台 worker 逐个执行，避免阻塞 HTTP 请求。
macOS 使用 afplay；测试/无设备用 MockPlayer。
"""

from __future__ import annotations

import asyncio
import logging
import shutil
import subprocess
from pathlib import Path
from typing import Protocol

from .envelope import ApiError, iso_now

logger = logging.getLogger(__name__)


class Player(Protocol):
    def available(self) -> bool: ...
    async def play(self, path: Path) -> None: ...


class AfplayPlayer:
    """macOS 系统播放器 afplay。"""

    def __init__(self, binary: str = "afplay"):
        self._binary = binary
        self._resolved = shutil.which(binary)

    def available(self) -> bool:
        return self._resolved is not None

    async def play(self, path: Path) -> None:
        proc = await asyncio.create_subprocess_exec(
            self._resolved or self._binary,
            str(path),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        await proc.wait()


class MockPlayer:
    """测试/无设备用：记录播放过的文件，不实际发声。"""

    def __init__(self):
        self.played: list[Path] = []

    def available(self) -> bool:
        return True

    async def play(self, path: Path) -> None:
        self.played.append(Path(path))


class PlaybackExecutor:
    def __init__(self, player: Player, max_queue: int = 32, device: str = "default"):
        self._player = player
        self._max_queue = max_queue
        self._device = device
        self._queue: asyncio.Queue[Path] | None = None
        self._task: asyncio.Task | None = None

    async def start(self) -> None:
        self._queue = asyncio.Queue(maxsize=self._max_queue)
        self._task = asyncio.create_task(self._worker(), name="playback-worker")

    async def stop(self) -> None:
        if self._task is not None:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

    def check_device(self) -> None:
        if not self._player.available():
            raise ApiError(
                "PLAYBACK_DEVICE_UNAVAILABLE",
                "播放设备不可用，请检查音频输出设备",
                {"device": self._device},
            )

    async def submit(self, path: Path) -> str:
        """提交一次播放任务，返回 submittedAt (ISO)。快速返回，不等待播放完成。"""
        self.check_device()
        if self._queue is None:
            raise ApiError("PLAYBACK_FAILED", "播放执行器未启动")
        try:
            self._queue.put_nowait(Path(path))
        except asyncio.QueueFull:
            raise ApiError("PLAYBACK_FAILED", "播放队列已满，请稍后重试")
        return iso_now()

    async def _worker(self) -> None:
        assert self._queue is not None
        while True:
            path = await self._queue.get()
            try:
                await self._player.play(path)
            except asyncio.CancelledError:
                raise
            except Exception as exc:  # 播放失败不影响主链路，仅记录
                logger.error("播放失败 %s: %s", path, exc)
            finally:
                self._queue.task_done()
