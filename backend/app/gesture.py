"""戒指手势状态存储 + 手势→技法解析 (backend.md §5.3 / §7.2)。

纯逻辑、无 BLE 依赖，便于单测。戒指 BLE worker 与 HTTP 上报接口
都通过 update() 写入同一份 GestureState，通过 resolve_technique() 读取。
"""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass

from .constants import DEFAULT_TECHNIQUE, _BASE_TECHNIQUES


class TechniqueRegistry:
    """技法注册表：基础 normal + 配置扩展 (api.md §2.8)。"""

    def __init__(self, extra: dict[str, str] | None = None):
        self._names: dict[str, str] = dict(_BASE_TECHNIQUES)
        if extra:
            self._names.update(extra)

    def has(self, code: str) -> bool:
        return code in self._names

    def name(self, code: str) -> str | None:
        return self._names.get(code)

    def object(self, code: str) -> dict:
        """返回 {"code","name"}；未知技法回退用 code 作名称。"""
        return {"code": code, "name": self._names.get(code, code)}

    def list(self) -> list[dict]:
        return [{"code": c, "name": n} for c, n in self._names.items()]


@dataclass
class GestureState:
    deviceId: str | None = None
    gestureCode: str | None = None
    confidence: float | None = None
    timestamp: str | None = None       # 硬件手势时间 (ISO)
    connected: bool = False
    updatedAt: str | None = None       # 服务端接收时间 (ISO)
    _received_monotonic: float = 0.0   # 用于过期判断

    def to_public(self) -> dict:
        """api.md §7 state 里的 ring 结构。"""
        return {
            "connected": self.connected,
            "deviceId": self.deviceId,
            "gestureCode": self.gestureCode,
            "confidence": self.confidence,
            "updatedAt": self.updatedAt,
        }


class GestureStore:
    """线程安全的最近手势状态。BLE worker（后台线程）与 API 线程共享。"""

    def __init__(
        self,
        registry: TechniqueRegistry,
        expire_ms: int = 1000,
        mapping: dict[str, str] | None = None,
        fallback: str = DEFAULT_TECHNIQUE,
        min_confidence: float = 0.0,
        one_shot: bool = True,
        instrument_mapping: dict[str, dict[str, str]] | None = None,
        triggers: list[dict] | None = None,
    ):
        self._registry = registry
        self._expire_ms = expire_ms
        self._mapping = mapping or {}
        self._fallback = fallback
        self._min_confidence = min_confidence
        self._one_shot = one_shot
        self._instrument_mapping = instrument_mapping or {}
        self._triggers = triggers or []
        self._consumed = False
        self._lock = threading.Lock()
        self._state = GestureState()

    # -- 写入 -------------------------------------------------------------
    def update(
        self,
        device_id: str | None,
        gesture_code: str | None,
        confidence: float | None,
        timestamp: str | None,
        updated_at: str,
        connected: bool = True,
    ) -> None:
        with self._lock:
            self._consumed = False
            self._state = GestureState(
                deviceId=device_id,
                gestureCode=gesture_code,
                confidence=confidence,
                timestamp=timestamp,
                connected=connected,
                updatedAt=updated_at,
                _received_monotonic=time.monotonic(),
            )

    def mark_connected(self, device_id: str | None, updated_at: str) -> None:
        """戒指已连接但暂无手势：仅更新连接标记，不改变已识别手势。"""
        with self._lock:
            self._state.connected = True
            if device_id:
                self._state.deviceId = device_id
            self._state.updatedAt = updated_at

    def set_disconnected(self) -> None:
        with self._lock:
            self._state.connected = False

    # -- 全局映射管理 -------------------------------------------------------
    def get_mapping(self) -> dict[str, str]:
        with self._lock:
            return dict(self._mapping)

    def set_mapping(self, mapping: dict[str, str]) -> None:
        with self._lock:
            self._mapping = dict(mapping)

    def update_mapping(self, gesture_code: str, technique_code: str | None) -> None:
        with self._lock:
            if technique_code is None:
                self._mapping.pop(gesture_code, None)
            else:
                self._mapping[gesture_code] = technique_code

    # -- 乐器专属映射管理 ---------------------------------------------------
    def get_instrument_mapping(self) -> dict[str, dict[str, str]]:
        with self._lock:
            return {k: dict(v) for k, v in self._instrument_mapping.items()}

    def set_instrument_mapping(self, mapping: dict[str, dict[str, str]]) -> None:
        with self._lock:
            self._instrument_mapping = {k: dict(v) for k, v in mapping.items()}

    def update_instrument_mapping(self, instrument: str, gesture: str, technique: str | None) -> None:
        with self._lock:
            if technique is None:
                if instrument in self._instrument_mapping:
                    self._instrument_mapping[instrument].pop(gesture, None)
                    if not self._instrument_mapping[instrument]:
                        del self._instrument_mapping[instrument]
            else:
                self._instrument_mapping.setdefault(instrument, {})[gesture] = technique

    # -- 手势触发发音管理 ---------------------------------------------------
    def get_triggers(self) -> list[dict]:
        with self._lock:
            return list(self._triggers)

    def set_triggers(self, triggers: list[dict]) -> None:
        with self._lock:
            self._triggers = list(triggers)

    def find_trigger(self, gesture_name: str) -> dict | None:
        with self._lock:
            for t in self._triggers:
                if t.get("gesture") == gesture_name:
                    return dict(t)
            return None

    # -- 读取 -------------------------------------------------------------
    def snapshot(self) -> GestureState:
        with self._lock:
            return GestureState(**vars(self._state))

    def _has_fresh_gesture(self, state: GestureState) -> bool:
        if state.gestureCode is None:
            return False
        age_ms = (time.monotonic() - state._received_monotonic) * 1000.0
        return age_ms <= self._expire_ms

    def resolve_technique(self, instrument: str | None = None) -> tuple[dict, list[str]]:
        """解析当前技法。

        返回 (technique_object, warnings)。规则：
        - 未连接 -> fallback normal + warning
        - 已连接但无新鲜手势/置信度不足/无映射 -> fallback normal（无 warning）
        - one_shot 模式下已消费 -> fallback normal
        - 命中乐器专属映射 > 全局映射 -> 对应技法
        """
        state = self.snapshot()
        warnings: list[str] = []

        if not state.connected:
            warnings.append(f"戒指未连接，已使用默认技法 {self._fallback}")
            return self._registry.object(self._fallback), warnings

        if not self._has_fresh_gesture(state):
            return self._registry.object(self._fallback), warnings

        with self._lock:
            if self._one_shot and self._consumed:
                return self._registry.object(self._fallback), warnings

        if state.confidence is not None and state.confidence < self._min_confidence:
            return self._registry.object(self._fallback), warnings

        gesture = state.gestureCode or ""

        # 优先乐器专属映射
        technique_code = None
        if instrument:
            with self._lock:
                inst_map = self._instrument_mapping.get(instrument)
                if inst_map:
                    technique_code = inst_map.get(gesture)

        # 回退全局映射
        if not technique_code:
            with self._lock:
                technique_code = self._mapping.get(gesture)

        if not technique_code or not self._registry.has(technique_code):
            return self._registry.object(self._fallback), warnings

        # one-shot: 标记已消费
        if self._one_shot:
            with self._lock:
                self._consumed = True

        return self._registry.object(technique_code), warnings

    def resolve_technique_for(self, gesture_code: str | None, instrument: str | None = None) -> dict:
        """给定手势编码直接解析技法对象（用于上报接口回显）。"""
        gesture = gesture_code or ""
        code = None
        if instrument:
            with self._lock:
                inst_map = self._instrument_mapping.get(instrument)
                if inst_map:
                    code = inst_map.get(gesture)
        if not code:
            with self._lock:
                code = self._mapping.get(gesture)
        if code and self._registry.has(code):
            return self._registry.object(code)
        return self._registry.object(self._fallback)
