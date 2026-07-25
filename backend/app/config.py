"""运行配置加载 (backend.md §8)。

优先级：环境变量 > config.json > 默认值。
仅对少量关键项支持环境变量覆盖（端口、音频根目录、戒指开关/地址）。
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from pathlib import Path

# 项目根目录 = 本文件所在 app/ 的上一级
BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_CONFIG_PATH = BASE_DIR / "config.json"


@dataclass
class ServerConfig:
    port: int = 8080
    host: str = "0.0.0.0"


@dataclass
class AudioConfig:
    rootDir: str = "audio"


@dataclass
class PlaybackConfig:
    device: str = "default"
    queueMode: str = "serial"
    maxQueue: int = 32


@dataclass
class GestureFilterConfig:
    enabled: bool = True
    sampleRate: float = 25.0
    cutoffHz: float = 10.0
    order: int = 2
    medianKernel: int = 5


@dataclass
class GestureDtwConfig:
    thresholdMultiplier: float = 1.5
    lengthRatioMin: float = 0.4
    lengthRatioMax: float = 2.5


@dataclass
class GestureHmmConfig:
    modelDir: str = "vendor/models"
    nStates: int = 6
    windowSize: int = 8
    windowOverlap: int = 4


@dataclass
class GestureConfig:
    method: str = "dtw"  # "dtw" | "hmm"
    expireMs: int = 1000
    fallbackTechnique: str = "normal"
    oneShot: bool = True
    mapping: dict[str, str] = field(default_factory=dict)
    instrumentMapping: dict[str, dict[str, str]] = field(default_factory=dict)
    gestureTriggers: list[dict] = field(default_factory=list)
    techniques: dict[str, str] = field(default_factory=dict)
    minConfidence: float = 0.0
    filter: GestureFilterConfig = field(default_factory=GestureFilterConfig)
    dtw: GestureDtwConfig = field(default_factory=GestureDtwConfig)
    hmm: GestureHmmConfig = field(default_factory=GestureHmmConfig)


@dataclass
class HistoryConfig:
    maxSize: int = 100


@dataclass
class CorsConfig:
    allowOrigins: list[str] = field(default_factory=lambda: ["http://localhost:3000"])


@dataclass
class RingConfig:
    enabled: bool = False
    address: str = ""


@dataclass
class AuthConfig:
    enabled: bool = False
    token: str = ""


@dataclass
class VoiceConfig:
    enabled: bool = False
    stepfun_api_key: str = ""
    stepfun_base_url: str = "https://api.stepfun.com/v1"
    asr_model: str = "stepaudio-2.5-asr"
    llm_model: str = "step-3.7-flash"


@dataclass
class Config:
    server: ServerConfig = field(default_factory=ServerConfig)
    audio: AudioConfig = field(default_factory=AudioConfig)
    playback: PlaybackConfig = field(default_factory=PlaybackConfig)
    gesture: GestureConfig = field(default_factory=GestureConfig)
    history: HistoryConfig = field(default_factory=HistoryConfig)
    cors: CorsConfig = field(default_factory=CorsConfig)
    ring: RingConfig = field(default_factory=RingConfig)
    auth: AuthConfig = field(default_factory=AuthConfig)
    voice: VoiceConfig = field(default_factory=VoiceConfig)

    @property
    def audio_root(self) -> Path:
        root = Path(self.audio.rootDir)
        if not root.is_absolute():
            root = BASE_DIR / root
        return root


def _merge(dc, data: dict):
    """把 dict 里已知字段合并进 dataclass 实例。"""
    for key, value in data.items():
        if hasattr(dc, key):
            setattr(dc, key, value)
    return dc


def _bool_env(name: str) -> bool | None:
    raw = os.environ.get(name)
    if raw is None:
        return None
    return raw.strip().lower() in ("1", "true", "yes", "on")


def load_config(path: str | Path | None = None) -> Config:
    """从 config.json 加载配置，缺省用默认值；再叠加环境变量覆盖。"""
    cfg = Config()

    config_path = Path(path) if path else DEFAULT_CONFIG_PATH
    if config_path.exists():
        raw = json.loads(config_path.read_text(encoding="utf-8"))
        _merge(cfg.server, raw.get("server", {}))
        _merge(cfg.audio, raw.get("audio", {}))
        _merge(cfg.playback, raw.get("playback", {}))
        _merge(cfg.gesture, raw.get("gesture", {}))
        gesture_raw = raw.get("gesture", {})
        if "filter" in gesture_raw:
            _merge(cfg.gesture.filter, gesture_raw["filter"])
        if "dtw" in gesture_raw:
            _merge(cfg.gesture.dtw, gesture_raw["dtw"])
        if "hmm" in gesture_raw:
            _merge(cfg.gesture.hmm, gesture_raw["hmm"])
        _merge(cfg.history, raw.get("history", {}))
        _merge(cfg.cors, raw.get("cors", {}))
        _merge(cfg.ring, raw.get("ring", {}))
        _merge(cfg.auth, raw.get("auth", {}))
        _merge(cfg.voice, raw.get("voice", {}))

    # 环境变量覆盖（关键项）
    if (port := os.environ.get("APP_PORT")):
        cfg.server.port = int(port)
    if (host := os.environ.get("APP_HOST")):
        cfg.server.host = host
    if (root := os.environ.get("AUDIO_ROOT")):
        cfg.audio.rootDir = root
    ring_enabled = _bool_env("RING_ENABLED")
    if ring_enabled is not None:
        cfg.ring.enabled = ring_enabled
    if (addr := os.environ.get("RING_ADDRESS")):
        cfg.ring.address = addr
    if (api_key := os.environ.get("STEPFUN_API_KEY")):
        cfg.voice.stepfun_api_key = api_key
    voice_enabled = _bool_env("VOICE_ENABLED")
    if voice_enabled is not None:
        cfg.voice.enabled = voice_enabled

    return cfg
