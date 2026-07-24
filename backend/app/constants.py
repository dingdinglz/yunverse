"""枚举常量与音调路径转换。

严格对齐 api.md §2.5-2.8 的编码与顺序。
"""

from __future__ import annotations

# ---------------------------------------------------------------------------
# 乐器 (api.md §2.5)
# ---------------------------------------------------------------------------
# code -> 中文展示名
INSTRUMENTS: dict[str, str] = {
    "guitar": "吉他",
    "pipa": "琵琶",
    "suona": "唢呐",
}


# ---------------------------------------------------------------------------
# 音调 (api.md §2.6) —— 顺序严格照文档
# ---------------------------------------------------------------------------
KEYS: list[str] = [
    "C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb",
    "G", "G#", "Ab", "A", "A#", "Bb", "B",
]
_KEYS_SET = set(KEYS)


# ---------------------------------------------------------------------------
# 音符 (api.md §2.7) —— code, label, degree, register
# ---------------------------------------------------------------------------
_NOTE_NAMES = ["do", "ri", "mi", "fa", "so", "la", "xi"]

GUITAR_NOTES: list[dict] = [
    {"code": name, "label": name, "degree": i, "register": "normal"}
    for i, name in enumerate(_NOTE_NAMES, 1)
]

PIPA_NOTES: list[dict] = [
    *[{"code": f"{name}_low", "label": name, "degree": i, "register": "low"}
      for i, name in enumerate(_NOTE_NAMES, 1)],
    *[{"code": name, "label": name, "degree": i, "register": "normal"}
      for i, name in enumerate(_NOTE_NAMES, 1)],
    {"code": "do_high", "label": "do", "degree": 1, "register": "high"},
]

SUONA_NOTES: list[dict] = [
    *[{"code": f"{name}_low", "label": name, "degree": i, "register": "low"}
      for i, name in enumerate(_NOTE_NAMES[4:], 5)],
    *[{"code": name, "label": name, "degree": i, "register": "normal"}
      for i, name in enumerate(_NOTE_NAMES[:6], 1)],
]

INSTRUMENT_NOTES: dict[str, list[dict]] = {
    "guitar": GUITAR_NOTES,
    "pipa": PIPA_NOTES,
    "suona": SUONA_NOTES,
}

NOTES: list[dict] = GUITAR_NOTES

_NOTE_BY_CODE: dict[str, dict] = {
    n["code"]: n
    for notes in INSTRUMENT_NOTES.values()
    for n in notes
}


# ---------------------------------------------------------------------------
# 技法 (api.md §2.8) —— 初始只有 normal，可由配置扩展
# ---------------------------------------------------------------------------
DEFAULT_TECHNIQUE = "normal"
_BASE_TECHNIQUES: dict[str, str] = {
    "normal": "普通演奏",
}


def instrument_name(code: str) -> str | None:
    """返回乐器中文名，未知返回 None。"""
    return INSTRUMENTS.get(code)


def is_valid_instrument(code: str) -> bool:
    return code in INSTRUMENTS


def is_valid_key(code: str) -> bool:
    return code in _KEYS_SET


def is_valid_note(code: str) -> bool:
    return code in _NOTE_BY_CODE


def note_label(code: str) -> str | None:
    note = _NOTE_BY_CODE.get(code)
    return note["label"] if note else None


def note_object(code: str) -> dict | None:
    """返回 {"code","label"} 结构（api.md 响应用）。"""
    note = _NOTE_BY_CODE.get(code)
    if note is None:
        return None
    return {"code": note["code"], "label": note["label"]}


def instrument_object(code: str) -> dict | None:
    """返回 {"code","name"} 结构。"""
    name = INSTRUMENTS.get(code)
    if name is None:
        return None
    return {"code": code, "name": name}


def key_to_path(key: str) -> str:
    """把接口音调编码转换为文件系统安全路径标识。

    规则 (backend.md §5.4)::

        C   -> C
        C#  -> C_sharp
        Db  -> D_flat

    同时兼容 unicode 升降号 ♯ / ♭。
    """
    if not key:
        return key
    base = key[0]
    accidental = key[1:]
    if accidental in ("#", "♯"):  # ♯
        return f"{base}_sharp"
    if accidental in ("b", "B", "♭"):  # ♭
        return f"{base}_flat"
    return key
