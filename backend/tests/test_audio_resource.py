import pytest

from app.audio_resource import AudioResource
from app.envelope import ApiError


def _make(tmp_path, rel):
    p = tmp_path / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_bytes(b"RIFF0000WAVE")
    return p


def test_resolve_found(tmp_path):
    _make(tmp_path, "pipa/D/normal/so.wav")
    ar = AudioResource(tmp_path, root_name="audio")
    r = ar.resolve("pipa", "D", "so", "normal")
    assert r["path"] == "audio/pipa/D/normal/so.wav"
    assert r["format"] == "wav"
    assert r["technique"] == "normal"


def test_key_conversion_path(tmp_path):
    _make(tmp_path, "pipa/C_sharp/normal/do_high.wav")
    ar = AudioResource(tmp_path, root_name="audio")
    r = ar.resolve("pipa", "C#", "do_high", "normal")
    assert r["path"] == "audio/pipa/C_sharp/normal/do_high.wav"


def test_fallback_to_normal(tmp_path):
    _make(tmp_path, "pipa/D/normal/so.wav")
    ar = AudioResource(tmp_path, root_name="audio")
    # pluck 缺失 -> 回退 normal
    r = ar.resolve("pipa", "D", "so", "pluck")
    assert r["technique"] == "normal"
    assert r["path"] == "audio/pipa/D/normal/so.wav"


def test_not_found(tmp_path):
    ar = AudioResource(tmp_path, root_name="audio")
    with pytest.raises(ApiError) as exc:
        ar.resolve("pipa", "D", "so", "normal")
    assert exc.value.code == "AUDIO_NOT_FOUND"
    assert exc.value.details["expectedPath"] == "audio/pipa/D/normal/so.wav"


def test_reindex_picks_new_file(tmp_path):
    ar = AudioResource(tmp_path, root_name="audio")
    with pytest.raises(ApiError):
        ar.resolve("pipa", "D", "so", "normal")
    _make(tmp_path, "pipa/D/normal/so.wav")
    ar.reindex()
    assert ar.resolve("pipa", "D", "so", "normal")["path"].endswith("so.wav")
