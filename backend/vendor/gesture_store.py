"""Persistence layer for gesture templates — save/load from JSON files."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone, timedelta
from pathlib import Path

import numpy as np

from gesture_engine import GestureTemplate, compute_threshold

GESTURES_DIR = Path("gestures")


def _safe_filename(name: str) -> str:
    safe = re.sub(r'[^\w\u4e00-\u9fff\-]', '_', name)
    return safe[:64] or "gesture"


def save_gesture(name: str, repetitions: list[np.ndarray], threshold: float | None = None) -> Path:
    if threshold is None:
        threshold = compute_threshold(repetitions)

    GESTURES_DIR.mkdir(exist_ok=True)

    tz = timezone(timedelta(hours=8))
    data = {
        "name": name,
        "created_at": datetime.now(tz).isoformat(),
        "sample_rate_hz": 25,
        "num_repetitions": len(repetitions),
        "threshold": threshold,
        "repetitions": [
            {
                "index": i,
                "num_samples": len(rep),
                "data": rep.tolist(),
            }
            for i, rep in enumerate(repetitions)
        ],
    }

    path = GESTURES_DIR / f"{_safe_filename(name)}.json"
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def load_gesture(path: Path) -> GestureTemplate:
    raw = json.loads(path.read_text(encoding="utf-8"))
    name = raw["name"]
    threshold = raw["threshold"]
    repetitions = [np.array(rep["data"], dtype=np.int16) for rep in raw["repetitions"]]
    return GestureTemplate(name=name, repetitions=repetitions, threshold=threshold)


def load_all_gestures() -> dict[str, GestureTemplate]:
    templates: dict[str, GestureTemplate] = {}
    if not GESTURES_DIR.exists():
        return templates
    for path in GESTURES_DIR.glob("*.json"):
        try:
            t = load_gesture(path)
            templates[t.name] = t
        except Exception:
            continue
    return templates


def delete_gesture(name: str) -> bool:
    if not GESTURES_DIR.exists():
        return False
    path = GESTURES_DIR / f"{_safe_filename(name)}.json"
    if path.exists():
        path.unlink()
        return True
    return False
