from app.envelope import (
    ApiError,
    error_body,
    new_event_id,
    new_request_id,
    success_body,
)


def test_success_body():
    b = success_body({"x": 1})
    assert b["success"] is True
    assert b["data"] == {"x": 1}
    assert b["requestId"].startswith("req_")


def test_error_body():
    b = error_body("INVALID_PARAMETER", "bad", {"field": "note", "value": "sol"})
    assert b["success"] is False
    assert b["error"]["code"] == "INVALID_PARAMETER"
    assert b["error"]["message"] == "bad"
    assert b["error"]["details"]["field"] == "note"
    assert b["requestId"].startswith("req_")


def test_error_body_without_details_omits_key():
    b = error_body("INTERNAL_ERROR", "x")
    assert "details" not in b["error"]


def test_ids_unique_and_prefixed():
    assert new_request_id() != new_request_id()
    assert new_event_id().startswith("evt_")
    assert new_request_id().startswith("req_")


def test_apierror_http_status():
    assert ApiError("AUDIO_NOT_FOUND", "x").http_status == 404
    assert ApiError("INVALID_PARAMETER", "x").http_status == 400
    assert ApiError("PLAYBACK_DEVICE_UNAVAILABLE", "x").http_status == 503
    assert ApiError("PLAYBACK_FAILED", "x").http_status == 500
