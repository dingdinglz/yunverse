from app.gesture import GestureStore, TechniqueRegistry


def test_registry():
    reg = TechniqueRegistry({"pluck": "拨弦"})
    assert reg.has("normal") and reg.has("pluck")
    assert reg.object("normal") == {"code": "normal", "name": "普通演奏"}
    assert reg.object("pluck") == {"code": "pluck", "name": "拨弦"}
    codes = {t["code"] for t in reg.list()}
    assert {"normal", "pluck"} <= codes


def test_disconnected_fallback_with_warning():
    gs = GestureStore(TechniqueRegistry())
    tech, warns = gs.resolve_technique()
    assert tech["code"] == "normal"
    assert warns and "戒指未连接" in warns[0]


def test_connected_no_mapping_no_warning():
    gs = GestureStore(TechniqueRegistry(), expire_ms=100000, mapping={})
    gs.update("ring-1", "敲击", 0.9, "t", "t", connected=True)
    tech, warns = gs.resolve_technique()
    assert tech["code"] == "normal"
    assert warns == []


def test_mapping_hit():
    gs = GestureStore(
        TechniqueRegistry({"pluck": "拨弦"}),
        expire_ms=100000,
        mapping={"敲击": "pluck"},
    )
    gs.update("ring-1", "敲击", 0.9, "t", "t", connected=True)
    tech, warns = gs.resolve_technique()
    assert tech["code"] == "pluck"
    assert warns == []


def test_expired_gesture_falls_back():
    gs = GestureStore(
        TechniqueRegistry({"pluck": "拨弦"}),
        expire_ms=0,
        mapping={"敲击": "pluck"},
    )
    gs.update("ring-1", "敲击", 0.9, "t", "t", connected=True)
    tech, warns = gs.resolve_technique()
    assert tech["code"] == "normal"
    assert warns == []  # 已连接，无未连接告警


def test_mark_connected_then_disconnected():
    gs = GestureStore(TechniqueRegistry())
    gs.mark_connected("ring-1", "t")
    assert gs.snapshot().connected is True
    gs.set_disconnected()
    assert gs.snapshot().connected is False
