"""从 WebAudioFont GM 音色库生成西洋乐器 wav 文件。

用法: python generate_western_audio.py
依赖: numpy, scipy
"""

import base64
import json
import math
import os
import re
import struct
import wave
from pathlib import Path
from urllib.request import urlopen

import numpy as np
from scipy.signal import resample

BASE_URL = "https://surikov.github.io/webaudiofontdata/sound"

PRESETS = {
    "piano": "0000_FluidR3_GM_sf2_file",
    "guitar": "0250_FluidR3_GM_sf2_file",
    "violin": "0400_FluidR3_GM_sf2_file",
    "flute": "0730_FluidR3_GM_sf2_file",
    "bass": "0320_FluidR3_GM_sf2_file",
}

NOTE_NAMES = ["do", "ri", "mi", "fa", "so", "la", "xi"]

# C major solfege -> MIDI pitch (octave 4 = normal)
SOLFEGE_TO_SEMITONE = [0, 2, 4, 5, 7, 9, 11]  # C D E F G A B

INSTRUMENT_REGISTERS = {
    "piano": ["low", "normal", "high"],
    "guitar": ["low", "normal", "high"],
    "violin": ["normal", "high"],
    "flute": ["normal", "high"],
    "bass": ["low", "normal"],
}

REGISTER_OCTAVE = {"low": 3, "normal": 4, "high": 5}

# 生成哪些调: key_name -> 相对 C 的半音偏移
KEYS_TO_GENERATE = {"C": 0, "D": 2}

DURATION_SEC = 2.0
SAMPLE_RATE = 44100


def fetch_preset(name: str) -> list[dict]:
    """下载并解析 WebAudioFont JS preset，返回 zones 列表。"""
    url = f"{BASE_URL}/{name}.js"
    print(f"  下载 {url} ...")
    resp = urlopen(url)
    js_text = resp.read().decode("utf-8")

    # 用 Node.js 解析 JS 对象（处理 unquoted keys + single-quoted strings）
    import subprocess
    import tempfile

    with tempfile.NamedTemporaryFile(mode="w", suffix=".js", delete=False) as f:
        f.write("console.log=function(){};\n")
        f.write(js_text)
        f.write(f"\nprocess.stdout.write(JSON.stringify(_tone_{name}.zones));")
        tmp_path = f.name

    try:
        result = subprocess.run(
            ["node", tmp_path], capture_output=True, text=True, timeout=30
        )
        if result.returncode != 0:
            raise ValueError(f"Node.js 解析失败: {result.stderr[:200]}")
        zones = json.loads(result.stdout)
    finally:
        os.unlink(tmp_path)

    print(f"    解析到 {len(zones)} 个 zones")
    return zones


def find_zone(zones: list[dict], midi_pitch: int) -> dict | None:
    """根据 MIDI pitch 找到对应 zone。"""
    for z in zones:
        low = z.get("keyRangeLow", 0)
        high = z.get("keyRangeHigh", 127)
        if low <= midi_pitch <= high:
            return z
    return None


def decode_sample(zone: dict) -> tuple[np.ndarray, int]:
    """解码 zone 的 PCM 采样数据，返回 float32 数组和采样率。"""
    sr = zone.get("sampleRate", 44100)

    if "sample" in zone:
        raw = base64.b64decode(zone["sample"])
        n_samples = len(raw) // 2
        samples = np.zeros(n_samples, dtype=np.float32)
        for i in range(n_samples):
            val = struct.unpack_from("<h", raw, i * 2)[0]
            samples[i] = val / 32768.0
        return samples, sr
    elif "file" in zone:
        import subprocess
        import tempfile
        raw = base64.b64decode(zone["file"])
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
            f.write(raw)
            tmp_in = f.name
        tmp_out = tmp_in + ".wav"
        try:
            subprocess.run(
                ["ffmpeg", "-y", "-i", tmp_in, "-ac", "1", "-ar", str(sr),
                 "-sample_fmt", "s16", tmp_out],
                capture_output=True, timeout=10
            )
            with wave.open(tmp_out, "r") as wf:
                frames = wf.readframes(wf.getnframes())
                sr = wf.getframerate()
            int16 = np.frombuffer(frames, dtype=np.int16)
            samples = int16.astype(np.float32) / 32768.0
        finally:
            for p in (tmp_in, tmp_out):
                if os.path.exists(p):
                    os.unlink(p)
        return samples, sr
    else:
        raise ValueError("zone 没有 sample 或 file 字段")


def render_note(zones: list[dict], midi_pitch: int, duration: float = DURATION_SEC) -> np.ndarray | None:
    """渲染一个音符为 float32 数组（44100Hz mono）。"""
    zone = find_zone(zones, midi_pitch)
    if zone is None:
        print(f"    警告: MIDI {midi_pitch} 没有匹配的 zone")
        return None

    try:
        samples, sr = decode_sample(zone)
    except ValueError as e:
        print(f"    警告: MIDI {midi_pitch} 解码失败: {e}")
        return None

    # 计算 playback rate
    original_pitch = zone.get("originalPitch", midi_pitch * 100)
    coarse_tune = zone.get("coarseTune", 0)
    fine_tune = zone.get("fineTune", 0)
    base_detune = original_pitch - 100.0 * coarse_tune - fine_tune
    playback_rate = math.pow(2, (100.0 * midi_pitch - base_detune) / 1200.0)

    # resample: 改变采样数等效于改变播放速率
    target_len = int(len(samples) / playback_rate)
    if target_len < 100:
        return None

    resampled = resample(samples, target_len).astype(np.float32)

    # 如果采样率不是 44100，再做一次转换
    if sr != SAMPLE_RATE:
        final_len = int(len(resampled) * SAMPLE_RATE / sr)
        resampled = resample(resampled, final_len).astype(np.float32)

    # 截取到目标时长
    max_samples = int(duration * SAMPLE_RATE)
    if len(resampled) > max_samples:
        resampled = resampled[:max_samples]

    # 应用淡出（最后 0.1s）
    fade_samples = int(0.1 * SAMPLE_RATE)
    if len(resampled) > fade_samples:
        fade = np.linspace(1.0, 0.0, fade_samples, dtype=np.float32)
        resampled[-fade_samples:] *= fade

    # normalize
    peak = np.max(np.abs(resampled))
    if peak > 0:
        resampled = resampled / peak * 0.9

    return resampled


def write_wav(path: Path, data: np.ndarray):
    """写入 16-bit mono wav。"""
    path.parent.mkdir(parents=True, exist_ok=True)
    int16_data = (data * 32767).astype(np.int16)
    with wave.open(str(path), "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(int16_data.tobytes())


def midi_pitch_for(note_idx: int, register: str, semitone_offset: int = 0) -> int:
    """计算 MIDI pitch: note_idx 0-6, register low/normal/high, 加调号偏移。"""
    octave = REGISTER_OCTAVE[register]
    return 12 * (octave + 1) + SOLFEGE_TO_SEMITONE[note_idx] + semitone_offset


def main():
    audio_root = Path(__file__).parent.parent / "audio"

    for instrument, preset_name in PRESETS.items():
        print(f"\n{'='*50}")
        print(f"生成 {instrument} 音频...")
        print(f"{'='*50}")

        zones = fetch_preset(preset_name)
        registers = INSTRUMENT_REGISTERS[instrument]

        generated = 0
        for key_name, semitone_offset in KEYS_TO_GENERATE.items():
            for register in registers:
                for i, note_name in enumerate(NOTE_NAMES):
                    midi = midi_pitch_for(i, register, semitone_offset)
                    code = note_name if register == "normal" else f"{note_name}_{register}"

                    audio = render_note(zones, midi)
                    if audio is None:
                        print(f"    跳过 {key_name}/{code} (MIDI {midi})")
                        continue

                    out_path = audio_root / instrument / key_name / "normal" / f"{code}.wav"
                    write_wav(out_path, audio)
                    generated += 1

        print(f"  完成: {generated} 个文件")

    print("\n全部生成完毕!")


if __name__ == "__main__":
    main()
