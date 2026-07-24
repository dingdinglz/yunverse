"""演奏编排 (backend.md §5.2 / §7.1)。

固定顺序：参数校验 → 解析技法 → 定位音频 → 提交播放 → 记录状态/历史 → 生成响应。
"""

from __future__ import annotations

from .audio_resource import AudioResource
from .constants import (
    INSTRUMENTS,
    KEYS,
    NOTES,
    instrument_object,
    is_valid_instrument,
    is_valid_key,
    is_valid_note,
    note_object,
)
from .envelope import ApiError, iso_now, new_event_id
from .gesture import GestureStore
from .playback import PlaybackExecutor
from .state_store import StateStore


def _validate(instrument: str, key: str, note: str) -> None:
    if not is_valid_instrument(instrument):
        raise ApiError(
            "INVALID_PARAMETER",
            "instrument 参数不合法",
            {"field": "instrument", "value": instrument, "allowedValues": list(INSTRUMENTS.keys())},
        )
    if not is_valid_key(key):
        raise ApiError(
            "INVALID_PARAMETER",
            "key 参数不合法",
            {"field": "key", "value": key, "allowedValues": KEYS},
        )
    if not is_valid_note(note):
        raise ApiError(
            "INVALID_PARAMETER",
            "note 参数不合法",
            {"field": "note", "value": note, "allowedValues": [n["code"] for n in NOTES]},
        )


class Orchestrator:
    def __init__(
        self,
        gesture_store: GestureStore,
        audio: AudioResource,
        playback: PlaybackExecutor,
        state_store: StateStore,
    ):
        self._gesture = gesture_store
        self._audio = audio
        self._playback = playback
        self._state = state_store

    async def play(self, instrument: str, key: str, note: str, loop: bool = False) -> dict:
        # 1. 参数校验
        _validate(instrument, key, note)

        # 2. 解析技法（读取戒指手势；无效则回退 normal + warning）
        technique_obj, warnings = self._gesture.resolve_technique()

        # 3. 定位音频（缺失抛 AUDIO_NOT_FOUND，含默认技法兜底）
        audio = self._audio.resolve(instrument, key, note, technique_obj["code"])

        # 4. 提交播放（同步确认、异步播放；设备不可用/失败抛错）
        submitted_at = await self._playback.submit(audio["abs"], loop=loop)

        # 5. 组装事件 + 记录状态/历史
        event_id = new_event_id()
        created_at = iso_now()
        instrument_obj = instrument_object(instrument)
        note_obj = note_object(note)
        audio_obj = {"path": audio["path"], "format": audio["format"]}

        data = {
            "eventId": event_id,
            "instrument": instrument_obj,
            "key": key,
            "note": note_obj,
            "technique": technique_obj,
            "audio": audio_obj,
            "playback": {
                "played": True,
                "status": "played",
                "submittedAt": submitted_at,
            },
            "warnings": warnings,
        }

        history_item = {
            "eventId": event_id,
            "instrument": instrument_obj,
            "key": key,
            "note": note_obj,
            "technique": technique_obj,
            "audio": audio_obj,
            "playback": {"status": "played", "played": True},
            "warnings": warnings,
            "createdAt": created_at,
        }
        self._state.record(history_item)

        return data
