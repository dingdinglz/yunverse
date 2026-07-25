"""曲谱存储与进度追踪。

启动时加载 scores/ 目录下所有 JSON 曲谱文件；运行时维护"当前活跃曲谱"
及播放进度索引，演奏时可据此判断音符匹配并推进。
"""

from __future__ import annotations

import json
import logging
import threading
from pathlib import Path
from typing import Callable

logger = logging.getLogger(__name__)


class ScoreStore:
    def __init__(self, scores_dir: Path, on_change: Callable[[dict], None] | None = None):
        self._scores_dir = scores_dir
        self._on_change = on_change  # 状态变更回调（用于 SSE 广播）
        self._lock = threading.Lock()

        # 曲谱库：{id: score_dict}
        self._library: dict[str, dict] = {}
        self._load_library()

        # 活跃曲谱状态
        self._active_id: str | None = None
        self._current_index: int = 0

    # ------------------------------------------------------------------
    # 加载
    # ------------------------------------------------------------------
    def _load_library(self) -> None:
        if not self._scores_dir.exists():
            logger.warning("曲谱目录不存在: %s", self._scores_dir)
            return
        for p in sorted(self._scores_dir.glob("*.json")):
            try:
                data = json.loads(p.read_text(encoding="utf-8"))
                sid = data.get("id", p.stem)
                self._library[sid] = data
            except Exception as exc:
                logger.warning("加载曲谱失败 %s: %s", p.name, exc)
        logger.info("已加载 %d 首曲谱", len(self._library))

    # ------------------------------------------------------------------
    # 查询
    # ------------------------------------------------------------------
    def list_scores(self) -> list[dict]:
        """返回曲谱概要列表（不含 notes 详情）。"""
        result = []
        for s in self._library.values():
            result.append({
                "id": s["id"],
                "title": s["title"],
                "key": s["key"],
                "instrument": s["instrument"],
                "tempo": s.get("tempo"),
                "timeSignature": s.get("timeSignature"),
                "noteCount": len(s.get("notes", [])),
            })
        return result

    def get_score(self, score_id: str) -> dict | None:
        """返回完整曲谱（含 notes）。"""
        return self._library.get(score_id)

    # ------------------------------------------------------------------
    # 曲谱模式控制
    # ------------------------------------------------------------------
    def start(self, score_id: str) -> dict:
        """激活曲谱模式，返回初始状态。"""
        score = self._library.get(score_id)
        if score is None:
            raise KeyError(f"曲谱不存在: {score_id}")
        with self._lock:
            self._active_id = score_id
            self._current_index = 0
        snapshot = self._snapshot()
        self._notify(snapshot)
        return snapshot

    def stop(self) -> dict:
        """停止曲谱模式。"""
        with self._lock:
            self._active_id = None
            self._current_index = 0
        snapshot = self._snapshot()
        self._notify(snapshot)
        return snapshot

    def advance(self) -> dict:
        """手动推进到下一个音符（外部调用）。"""
        with self._lock:
            if self._active_id is None:
                return self._snapshot()
            score = self._library[self._active_id]
            total = len(score.get("notes", []))
            if self._current_index < total - 1:
                self._current_index += 1
            else:
                # 到达末尾，自动停止
                self._active_id = None
                self._current_index = 0
        snapshot = self._snapshot()
        self._notify(snapshot)
        return snapshot

    def try_advance_on_play(self, note_code: str) -> dict | None:
        """演奏时调用：如果音符匹配当前曲谱位置，自动推进。

        返回更新后的 snapshot（推进成功）或 None（不在曲谱模式/不匹配）。
        """
        with self._lock:
            if self._active_id is None:
                return None
            score = self._library[self._active_id]
            notes = score.get("notes", [])
            if self._current_index >= len(notes):
                return None
            expected = notes[self._current_index]["code"]
            if note_code != expected:
                return None
            # 匹配成功，推进
            total = len(notes)
            if self._current_index < total - 1:
                self._current_index += 1
            else:
                # 完成全曲
                self._active_id = None
                self._current_index = 0
            snapshot = self._snapshot()
        self._notify(snapshot)
        return snapshot

    # ------------------------------------------------------------------
    # 状态快照
    # ------------------------------------------------------------------
    def active_state(self) -> dict:
        """返回当前曲谱模式状态（给 SSE 初始帧 / API 查询）。"""
        return self._snapshot()

    def _snapshot(self) -> dict:
        """内部生成快照（调用者需持锁或在原子操作后调用）。"""
        if self._active_id is None:
            return {"active": False, "scoreId": None, "currentIndex": 0, "totalNotes": 0, "notes": []}
        score = self._library[self._active_id]
        notes = score.get("notes", [])
        return {
            "active": True,
            "scoreId": self._active_id,
            "title": score.get("title"),
            "instrument": score.get("instrument"),
            "key": score.get("key"),
            "tempo": score.get("tempo"),
            "currentIndex": self._current_index,
            "totalNotes": len(notes),
            # 发送当前位置附近的音符窗口（前2后6），PICO 用于渲染滚动流
            "notes": self._window(notes, self._current_index, before=2, after=6),
        }

    @staticmethod
    def _window(notes: list[dict], index: int, before: int = 2, after: int = 6) -> list[dict]:
        """截取当前索引附近的音符窗口，附加 index 字段。"""
        start = max(0, index - before)
        end = min(len(notes), index + after + 1)
        result = []
        for i in range(start, end):
            n = dict(notes[i])
            n["index"] = i
            n["active"] = (i == index)
            result.append(n)
        return result

    def _notify(self, snapshot: dict) -> None:
        if self._on_change:
            self._on_change(snapshot)
