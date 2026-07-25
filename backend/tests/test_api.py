import pytest
from fastapi.testclient import TestClient

from app.config import Config
from app.main import create_app
from app.playback import MockPlayer


@pytest.fixture
def client(tmp_path):
    cfg = Config()
    cfg.audio.rootDir = str(tmp_path)
    # 放一个可用音频：琵琶 D 调 normal so
    f = tmp_path / "pipa" / "D" / "normal" / "so.wav"
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_bytes(b"RIFF0000WAVE")

    app = create_app(config=cfg, player=MockPlayer(), start_ring=False)
    with TestClient(app) as c:
        yield c


def test_health(client):
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    b = r.json()
    assert b["success"] is True
    assert b["data"]["status"] == "ok"
    assert b["data"]["service"] == "virtual-instrument-backend"
    assert b["requestId"].startswith("req_")


def test_config(client):
    b = client.get("/api/v1/config").json()
    assert b["success"] is True
    data = b["data"]
    assert [i["code"] for i in data["instruments"]] == ["pipa", "suona", "guzheng", "erhu", "dizi"]
    assert all(i["enabled"] for i in data["instruments"])
    assert data["keys"][0] == "C"
    assert len(data["keys"]) == 17
    assert [n["code"] for n in data["notes"]][-1] == "so_high"
    assert "notesByInstrument" in data
    assert len(data["notesByInstrument"]["pipa"]) == 14
    assert len(data["notesByInstrument"]["suona"]) == 9
    assert len(data["notesByInstrument"]["guzheng"]) == 7
    assert len(data["notesByInstrument"]["erhu"]) == 12
    assert len(data["notesByInstrument"]["dizi"]) == 16
    assert data["techniques"][0]["code"] == "normal"


def test_play_success_default_technique(client):
    r = client.post("/api/v1/play", json={"instrument": "pipa", "key": "D", "note": "so"})
    assert r.status_code == 200
    d = r.json()["data"]
    assert d["playback"]["status"] == "played"
    assert d["playback"]["played"] is True
    assert d["audio"]["path"].endswith("pipa/D/normal/so.wav")
    assert d["audio"]["format"] == "wav"
    assert d["instrument"] == {"code": "pipa", "name": "琵琶"}
    assert d["note"] == {"code": "so", "label": "so"}
    assert d["technique"]["code"] == "normal"
    assert d["eventId"].startswith("evt_")
    # 未连接戒指 -> warnings 提示默认技法
    assert d["warnings"] and "戒指未连接" in d["warnings"][0]


def test_play_audio_not_found(client):
    r = client.post("/api/v1/play", json={"instrument": "pipa", "key": "C", "note": "do"})
    assert r.status_code == 404
    e = r.json()["error"]
    assert e["code"] == "AUDIO_NOT_FOUND"
    assert e["details"]["expectedPath"].endswith("pipa/C/normal/do.wav")


def test_play_invalid_instrument(client):
    r = client.post("/api/v1/play", json={"instrument": "drum", "key": "C", "note": "do"})
    assert r.status_code == 400
    e = r.json()["error"]
    assert e["code"] == "INVALID_PARAMETER"
    assert e["details"]["field"] == "instrument"
    assert "pipa" in e["details"]["allowedValues"]


def test_play_missing_field(client):
    r = client.post("/api/v1/play", json={"instrument": "pipa", "key": "D"})
    assert r.status_code == 400
    assert r.json()["error"]["code"] == "INVALID_PARAMETER"


def test_state_empty_then_played(client):
    s = client.get("/api/v1/state").json()["data"]
    assert s["playback"]["status"] == "idle"
    assert s["instrument"] is None
    assert s["ring"]["connected"] is False

    client.post("/api/v1/play", json={"instrument": "pipa", "key": "D", "note": "so"})
    s = client.get("/api/v1/state").json()["data"]
    assert s["playback"]["status"] == "played"
    assert s["instrument"]["code"] == "pipa"
    assert s["note"]["code"] == "so"


def test_history(client):
    client.post("/api/v1/play", json={"instrument": "pipa", "key": "D", "note": "so"})
    h = client.get("/api/v1/history?limit=10").json()["data"]
    assert h["nextCursor"] is None
    assert len(h["items"]) == 1
    item = h["items"][0]
    assert item["note"]["code"] == "so"
    assert item["playback"]["status"] == "played"
    assert item["createdAt"]


def test_ring_gesture(client):
    r = client.post(
        "/api/v1/ring/gesture",
        json={
            "deviceId": "ring-001",
            "gestureCode": "gesture_001",
            "confidence": 0.93,
            "timestamp": "2026-07-23T22:42:59+08:00",
        },
    )
    assert r.status_code == 200
    d = r.json()["data"]
    assert d["accepted"] is True
    assert d["deviceId"] == "ring-001"
    assert d["technique"]["code"] == "normal"

    s = client.get("/api/v1/state").json()["data"]
    assert s["ring"]["connected"] is True
    assert s["ring"]["gestureCode"] == "gesture_001"
    assert s["ring"]["confidence"] == 0.93


def test_ring_gesture_bad_confidence(client):
    r = client.post(
        "/api/v1/ring/gesture",
        json={"deviceId": "r", "gestureCode": "g", "confidence": 1.5, "timestamp": "t"},
    )
    assert r.status_code == 400
    e = r.json()["error"]
    assert e["code"] == "INVALID_PARAMETER"
    assert e["details"]["field"] == "confidence"
