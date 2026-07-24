"""HMM 手势识别引擎：加载训练好的模型，流式推理。"""

from __future__ import annotations

import pickle
from pathlib import Path

import numpy as np

from feature_extractor import FeatureExtractor
from gesture_engine import MotionSegmenter
from signal_filter import SignalFilter


class HMMRecognizer:
    """基于 Left-Right GaussianHMM 的手势识别器，接口与 DTW GestureRecognizer 对齐。"""

    def __init__(
        self,
        model_dir: str | Path,
        signal_filter: SignalFilter,
        feature_extractor: FeatureExtractor,
        min_confidence: float = 0.0,
    ):
        self.model_dir = Path(model_dir)
        self.filter = signal_filter
        self.extractor = feature_extractor
        self.min_confidence = min_confidence
        self.segmenter = MotionSegmenter()
        self.enabled = False
        self._cooldown_remaining = 0
        self._models: dict[str, object] = {}
        self._load_models()

    def _load_models(self) -> None:
        self._models = {}
        if not self.model_dir.exists():
            return
        for pkl_file in self.model_dir.glob("*.pkl"):
            name = pkl_file.stem
            with open(pkl_file, "rb") as f:
                self._models[name] = pickle.load(f)

    def reload_models(self) -> None:
        self._load_models()

    @property
    def templates(self) -> dict[str, object]:
        return self._models

    def add_template(self, template) -> None:
        pass

    def remove_template(self, name: str) -> None:
        self._models.pop(name, None)

    def feed(self, samples: list[list[int]]) -> tuple[str, float] | None:
        if not self.enabled or not self._models:
            return None

        if self._cooldown_remaining > 0:
            self._cooldown_remaining -= len(samples)
            for s in samples:
                self.segmenter._feed_one(s)
            return None

        segment = self.segmenter.feed(samples)
        if segment is None:
            return None

        return self._classify_segment(segment)

    def _classify_segment(self, segment: np.ndarray) -> tuple[str, float] | None:
        filtered = self.filter.apply(segment)
        features = self.extractor.extract(filtered)
        if features.shape[0] < 2:
            return None

        best_name = ""
        best_score = -np.inf
        scores: list[float] = []

        for name, model in self._models.items():
            try:
                score = model.score(features)  # type: ignore[union-attr]
                scores.append(score)
                if score > best_score:
                    best_score = score
                    best_name = name
            except Exception:
                continue

        if not best_name or len(scores) < 1:
            return None

        if len(scores) == 1:
            confidence = 0.8
        else:
            sorted_scores = sorted(scores, reverse=True)
            gap = sorted_scores[0] - sorted_scores[1]
            confidence = min(1.0, max(0.0, 1.0 - np.exp(-gap / 10.0)))

        if confidence < self.min_confidence:
            return None

        self._cooldown_remaining = 25
        return (best_name, confidence)
