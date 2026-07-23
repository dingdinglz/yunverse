from app.constants import (
    KEYS,
    NOTES,
    instrument_object,
    is_valid_key,
    is_valid_note,
    key_to_path,
    note_object,
)


def test_key_to_path():
    assert key_to_path("C") == "C"
    assert key_to_path("D") == "D"
    assert key_to_path("C#") == "C_sharp"
    assert key_to_path("F#") == "F_sharp"
    assert key_to_path("Db") == "D_flat"
    assert key_to_path("Bb") == "B_flat"


def test_note_object():
    assert note_object("do_high") == {"code": "do_high", "label": "do"}
    assert note_object("so") == {"code": "so", "label": "so"}
    assert note_object("bad") is None


def test_instrument_object():
    assert instrument_object("pipa") == {"code": "pipa", "name": "琵琶"}
    assert instrument_object("guitar") == {"code": "guitar", "name": "吉他"}
    assert instrument_object("drum") is None


def test_validators_and_order():
    assert is_valid_key("C#")
    assert not is_valid_key("H")
    assert is_valid_note("do_high")
    assert not is_valid_note("sol")
    # 顺序严格对齐 api.md §2.6
    assert KEYS[0] == "C" and KEYS[1] == "C#" and KEYS[-1] == "B"
    assert len(KEYS) == 17
    assert [n["code"] for n in NOTES][-1] == "do_high"
    assert len(NOTES) == 8
