"""音频资源索引与查找 (backend.md §5.4 / §7.3)。

目录约定::

    <rootDir>/<instrument>/<key_pathCode>/<technique>/<note>.wav
    例如 audio/pipa/D/normal/so.wav 、 audio/guitar/C_sharp/normal/do_high.wav

启动时建立索引避免每次磁盘扫描；查找时优先完整匹配，失败回退到
默认技法 normal；仍不存在则抛 AUDIO_NOT_FOUND。
"""

from __future__ import annotations

import logging
from pathlib import Path

from .constants import DEFAULT_TECHNIQUE, key_to_path
from .envelope import ApiError

logger = logging.getLogger(__name__)


class AudioResource:
    def __init__(self, root: Path, root_name: str = "audio"):
        self.root = Path(root)
        # 响应中 path 前缀（对齐 api.md 里的 "audio/..."）
        self.root_name = root_name.replace("\\", "/").rstrip("/")
        self._index: set[str] = set()
        self.reindex()

    def reindex(self) -> int:
        """扫描根目录建立 .wav 相对路径索引，返回索引条数。"""
        index: set[str] = set()
        if self.root.exists():
            for p in self.root.rglob("*.wav"):
                if p.is_file():
                    index.add(p.relative_to(self.root).as_posix())
        self._index = index
        logger.info("音频索引已加载: %d 个 wav (root=%s)", len(index), self.root)
        return len(index)

    @staticmethod
    def _rel(instrument: str, key_path: str, technique: str, note: str) -> str:
        return f"{instrument}/{key_path}/{technique}/{note}.wav"

    def _public(self, rel: str) -> str:
        return f"{self.root_name}/{rel}"

    def _exists(self, rel: str) -> bool:
        return rel in self._index or (self.root / rel).is_file()

    def resolve(self, instrument: str, key: str, note: str, technique: str) -> dict:
        """定位音频文件。

        返回 {"path", "format", "abs", "technique"}；找不到抛 ApiError。
        """
        key_path = key_to_path(key)
        primary_rel = self._rel(instrument, key_path, technique, note)

        candidates: list[tuple[str, str]] = [(technique, primary_rel)]
        if technique != DEFAULT_TECHNIQUE:
            candidates.append(
                (DEFAULT_TECHNIQUE, self._rel(instrument, key_path, DEFAULT_TECHNIQUE, note))
            )

        for tech, rel in candidates:
            if self._exists(rel):
                return {
                    "path": self._public(rel),
                    "format": "wav",
                    "abs": self.root / rel,
                    "technique": tech,
                }

        expected = self._public(primary_rel)
        logger.warning("音频缺失: %s", expected)
        raise ApiError(
            "AUDIO_NOT_FOUND",
            "未找到对应的音频资源",
            {
                "instrument": instrument,
                "key": key,
                "note": note,
                "technique": technique,
                "expectedPath": expected,
            },
        )
