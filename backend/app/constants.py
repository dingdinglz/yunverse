"""枚举常量与音调路径转换。

严格对齐 api.md §2.5-2.8 的编码与顺序。
"""

from __future__ import annotations

# ---------------------------------------------------------------------------
# 乐器 (api.md §2.5)
# ---------------------------------------------------------------------------
# code -> 中文展示名
INSTRUMENTS: dict[str, str] = {
    "pipa": "琵琶",
    "suona": "唢呐",
    "guzheng": "古筝",
    "erhu": "二胡",
    "dizi": "笛子",
    "piano": "钢琴",
    "guitar": "吉他",
    "violin": "小提琴",
    "flute": "长笛",
    "bass": "贝斯",
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

PIPA_NOTES: list[dict] = [
    {"code": "do_low", "label": "do", "degree": 1, "register": "low"},
    {"code": "so_low", "label": "so", "degree": 5, "register": "low"},
    {"code": "la_low", "label": "la", "degree": 6, "register": "low"},
    {"code": "do", "label": "do", "degree": 1, "register": "normal"},
    {"code": "ri", "label": "ri", "degree": 2, "register": "normal"},
    {"code": "mi", "label": "mi", "degree": 3, "register": "normal"},
    {"code": "fa", "label": "fa", "degree": 4, "register": "normal"},
    {"code": "so", "label": "so", "degree": 5, "register": "normal"},
    {"code": "la", "label": "la", "degree": 6, "register": "normal"},
    {"code": "xi", "label": "xi", "degree": 7, "register": "normal"},
    {"code": "do_high", "label": "do", "degree": 1, "register": "high"},
    {"code": "ri_high", "label": "ri", "degree": 2, "register": "high"},
    {"code": "mi_high", "label": "mi", "degree": 3, "register": "high"},
    {"code": "fa_high", "label": "fa", "degree": 4, "register": "high"},
    {"code": "so_high", "label": "so", "degree": 5, "register": "high"},
]

SUONA_NOTES: list[dict] = [
    *[{"code": f"{name}_low", "label": name, "degree": i, "register": "low"}
      for i, name in enumerate(_NOTE_NAMES[4:], 5)],
    *[{"code": name, "label": name, "degree": i, "register": "normal"}
      for i, name in enumerate(_NOTE_NAMES[:6], 1)],
]

GUZHENG_NOTES: list[dict] = [
    {"code": "so_low", "label": "so", "degree": 5, "register": "low"},
    {"code": "la_low", "label": "la", "degree": 6, "register": "low"},
    {"code": "do", "label": "do", "degree": 1, "register": "normal"},
    {"code": "ri", "label": "ri", "degree": 2, "register": "normal"},
    {"code": "mi", "label": "mi", "degree": 3, "register": "normal"},
    {"code": "so", "label": "so", "degree": 5, "register": "normal"},
    {"code": "la", "label": "la", "degree": 6, "register": "normal"},
]

ERHU_NOTES: list[dict] = [
    *[{"code": name, "label": name, "degree": i, "register": "normal"}
      for i, name in enumerate(_NOTE_NAMES, 1)],
    {"code": "do_high", "label": "do", "degree": 1, "register": "high"},
    {"code": "ri_high", "label": "ri", "degree": 2, "register": "high"},
    {"code": "mi_high", "label": "mi", "degree": 3, "register": "high"},
    {"code": "fa_high", "label": "fa", "degree": 4, "register": "high"},
    {"code": "so_high", "label": "so", "degree": 5, "register": "high"},
]

DIZI_NOTES: list[dict] = [
    {"code": "so_low", "label": "so", "degree": 5, "register": "low"},
    {"code": "la_low", "label": "la", "degree": 6, "register": "low"},
    {"code": "xi_low", "label": "xi", "degree": 7, "register": "low"},
    *[{"code": name, "label": name, "degree": i, "register": "normal"}
      for i, name in enumerate(_NOTE_NAMES, 1)],
    {"code": "do_high", "label": "do", "degree": 1, "register": "high"},
    {"code": "ri_high", "label": "ri", "degree": 2, "register": "high"},
    {"code": "mi_high", "label": "mi", "degree": 3, "register": "high"},
    {"code": "fa_high", "label": "fa", "degree": 4, "register": "high"},
    {"code": "so_high", "label": "so", "degree": 5, "register": "high"},
    {"code": "la_high", "label": "la", "degree": 6, "register": "high"},
]

PIANO_NOTES: list[dict] = [
    *[{"code": f"{name}_low", "label": name, "degree": i, "register": "low"}
      for i, name in enumerate(_NOTE_NAMES, 1)],
    *[{"code": name, "label": name, "degree": i, "register": "normal"}
      for i, name in enumerate(_NOTE_NAMES, 1)],
    *[{"code": f"{name}_high", "label": name, "degree": i, "register": "high"}
      for i, name in enumerate(_NOTE_NAMES, 1)],
]

GUITAR_NOTES: list[dict] = [
    *[{"code": f"{name}_low", "label": name, "degree": i, "register": "low"}
      for i, name in enumerate(_NOTE_NAMES, 1)],
    *[{"code": name, "label": name, "degree": i, "register": "normal"}
      for i, name in enumerate(_NOTE_NAMES, 1)],
    *[{"code": f"{name}_high", "label": name, "degree": i, "register": "high"}
      for i, name in enumerate(_NOTE_NAMES, 1)],
]

VIOLIN_NOTES: list[dict] = [
    *[{"code": name, "label": name, "degree": i, "register": "normal"}
      for i, name in enumerate(_NOTE_NAMES, 1)],
    *[{"code": f"{name}_high", "label": name, "degree": i, "register": "high"}
      for i, name in enumerate(_NOTE_NAMES, 1)],
]

FLUTE_NOTES: list[dict] = [
    *[{"code": name, "label": name, "degree": i, "register": "normal"}
      for i, name in enumerate(_NOTE_NAMES, 1)],
    *[{"code": f"{name}_high", "label": name, "degree": i, "register": "high"}
      for i, name in enumerate(_NOTE_NAMES, 1)],
]

BASS_NOTES: list[dict] = [
    *[{"code": f"{name}_low", "label": name, "degree": i, "register": "low"}
      for i, name in enumerate(_NOTE_NAMES, 1)],
    *[{"code": name, "label": name, "degree": i, "register": "normal"}
      for i, name in enumerate(_NOTE_NAMES, 1)],
]

INSTRUMENT_NOTES: dict[str, list[dict]] = {
    "pipa": PIPA_NOTES,
    "suona": SUONA_NOTES,
    "guzheng": GUZHENG_NOTES,
    "erhu": ERHU_NOTES,
    "dizi": DIZI_NOTES,
    "piano": PIANO_NOTES,
    "guitar": GUITAR_NOTES,
    "violin": VIOLIN_NOTES,
    "flute": FLUTE_NOTES,
    "bass": BASS_NOTES,
}

NOTES: list[dict] = PIPA_NOTES

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
    "saoxian": "扫弦",
    "rou": "揉弦",
    "shuang": "双弹",
    "fen": "分",
    "lunzhi": "轮指",
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
