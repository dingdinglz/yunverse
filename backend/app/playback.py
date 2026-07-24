"""播放执行模块 (backend.md §5.5 / §10)。

设计：打断模式。新音触发时立即终止当前播放并启动新播放，
保证演奏手感即时响应。
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
    def stop(self) -> None: ...


class AfplayPlayer:
    """macOS 系统播放器 afplay。"""

    def __init__(self, binary: str = "afplay"):
        self._binary = binary
        self._resolved = shutil.which(binary)
        self._proc: asyncio.subprocess.Process | None = None

    def available(self) -> bool:
        return self._resolved is not None

    def stop(self) -> None:
        if self._proc is not None and self._proc.returncode is None:
            self._proc.kill()
            self._proc = None

    async def play(self, path: Path) -> None:
        self._proc = await asyncio.create_subprocess_exec(
            self._resolved or self._binary,
            str(path),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        await self._proc.wait()
        self._proc = None


class MockPlayer:
    """测试/无设备用：记录播放过的文件，不实际发声。"""

    def __init__(self):
        self.played: list[Path] = []

    def available(self) -> bool:
        return True

    def stop(self) -> None:
        pass

    async def play(self, path: Path) -> None:
        self.played.append(Path(path))


class PlaybackExecutor:
    def __init__(self, player: Player, device: str = "default"):
        self._player = player
        self._device = device
        self._current_task: asyncio.Task | None = None

    async def start(self) -> None:
        pass

    async def stop(self) -> None:
        self._player.stop()
        if self._current_task is not None:
            self._current_task.cancel()
            try:
                await self._current_task
            except asyncio.CancelledError:
                pass
            self._current_task = None

    def check_device(self) -> None:
        if not self._player.available():
            raise ApiError(
                "PLAYBACK_DEVICE_UNAVAILABLE",
                "播放设备不可用，请检查音频输出设备",
                {"device": self._device},
            )

    async def submit(self, path: Path, loop: bool = False) -> str:
        """打断当前播放并立即播放新音频，返回 submittedAt (ISO)。"""
        self.check_device()
        self._player.stop()
        if self._current_task is not None:
            self._current_task.cancel()
            try:
                await self._current_task
            except asyncio.CancelledError:
                pass
        self._current_task = asyncio.create_task(self._do_play(path, loop))
        return iso_now()

    async def _do_play(self, path: Path, loop: bool = False) -> None:
        try:
            await self._player.play(path)
            while loop:
                await self._player.play(path)
        except asyncio.CancelledError:
            self._player.stop()
        except Exception as exc:
            logger.error("播放失败 %s: %s", path, exc)
