"""戒指设置页接口测试（无硬件路径）。

只覆盖不依赖真机/bleak 的分支：状态、手势列表（读 vendor/gestures）、
未连接时录制报错、连接缺参校验。真机相关的扫描/连接/IMU 不进 CI。
"""

import pytest
from fastapi.testclient import TestClient

from app.config import Config
from app.main import create_app
from app.playback import MockPlayer


@pytest.fixture
def client(tmp_path):
    cfg = Config()
    cfg.audio.rootDir = str(tmp_path)
    app = create_app(config=cfg, player=MockPlayer(), start_ring=False)
    with TestClient(app) as c:
        yield c


def test_ring_status_disconnected(client):
    b = client.get("/api/v1/ring/status").json()
    assert b["success"] is True
    data = b["data"]
    assert data["connection"] == "disconnected"
    assert data["address"] is None
    assert data["recording"] is None
    assert isinstance(data["gestureCount"], int)


def test_ring_gestures_list_vendor_templates(client):
    b = client.get("/api/v1/ring/gestures").json()
    assert b["success"] is True
    gestures = b["data"]["gestures"]
    assert isinstance(gestures, list)
    # vendor/gestures 已内置若干模板
    assert len(gestures) >= 1
    for g in gestures:
        assert set(g.keys()) == {"name", "sampleCount", "threshold"}
        assert g["sampleCount"] >= 1


def test_record_start_requires_connection(client):
    r = client.post(
        "/api/v1/ring/gestures/record/start",
        json={"name": "测试手势", "reps": 3},
    )
    assert r.status_code == 409
    b = r.json()
    assert b["success"] is False
    assert b["error"]["code"] == "RING_NOT_CONNECTED"


def test_connect_missing_address(client):
    # address 为空字符串 -> INVALID_PARAMETER
    r = client.post("/api/v1/ring/connect", json={"address": "  "})
    assert r.status_code == 400
    assert r.json()["error"]["code"] == "INVALID_PARAMETER"


def test_connect_body_validation(client):
    # 缺 address 字段 -> 422/400 参数校验
    r = client.post("/api/v1/ring/connect", json={})
    assert r.status_code == 400
    assert r.json()["error"]["code"] == "INVALID_PARAMETER"


def test_recording_ops_without_session(client):
    for path in (
        "/api/v1/ring/gestures/record/rep/start",
        "/api/v1/ring/gestures/record/rep/stop",
    ):
        r = client.post(path)
        # 未连接 -> RING_NOT_CONNECTED（require_connected 先触发）
        assert r.status_code == 409
        assert r.json()["error"]["code"] == "RING_NOT_CONNECTED"


def test_cancel_recording_idempotent(client):
    b = client.post("/api/v1/ring/gestures/record/cancel").json()
    assert b["success"] is True
    assert b["data"]["state"] == "cancelled"


def test_delete_unknown_gesture(client):
    r = client.delete("/api/v1/ring/gestures/不存在的手势xyz")
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "GESTURE_NOT_FOUND"


def test_recognition_toggle(client):
    b = client.post("/api/v1/ring/recognition", json={"enabled": False}).json()
    assert b["success"] is True
    assert b["data"]["recognitionEnabled"] is False
