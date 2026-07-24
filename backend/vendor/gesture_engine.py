"""Custom gesture recognition engine using DTW + motion energy segmentation."""

from __future__ import annotations

from typing import Protocol

import numpy as np


class BaseRecognizer(Protocol):
    """手势识别器统一协议，DTW 和 HMM 都实现此接口。"""

    enabled: bool
    templates: dict

    def feed(self, samples: list[list[int]]) -> tuple[str, float] | None: ...
    def add_template(self, template) -> None: ...
    def remove_template(self, name: str) -> None: ...


def preprocess(sequence: np.ndarray) -> np.ndarray:
    seq = sequence.astype(np.float64)
    # 3-point moving average smoothing
    if len(seq) > 3:
        kernel = np.ones(3) / 3.0
        for i in range(seq.shape[1]):
            seq[:, i] = np.convolve(seq[:, i], kernel, mode="same")
    # per-axis z-score normalization
    mean = seq.mean(axis=0)
    std = seq.std(axis=0)
    std[std < 1e-8] = 1.0
    return (seq - mean) / std


def dtw_distance(seq_a: np.ndarray, seq_b: np.ndarray, window: int | None = None) -> float:
    m, n = len(seq_a), len(seq_b)
    if window is None:
        window = max(m, n) // 4
    window = max(window, abs(m - n))

    cost = np.full((m + 1, n + 1), np.inf)
    cost[0, 0] = 0.0

    for i in range(1, m + 1):
        j_start = max(1, i - window)
        j_end = min(n, i + window)
        for j in range(j_start, j_end + 1):
            d = np.sqrt(np.sum((seq_a[i - 1] - seq_b[j - 1]) ** 2))
            cost[i, j] = d + min(cost[i - 1, j], cost[i, j - 1], cost[i - 1, j - 1])

    return cost[m, n] / (m + n)


def compute_threshold(repetitions: list[np.ndarray], multiplier: float = 1.5) -> float:
    if len(repetitions) < 2:
        return 5.0
    preprocessed = [preprocess(r) for r in repetitions]
    distances = []
    for i in range(len(preprocessed)):
        for j in range(i + 1, len(preprocessed)):
            distances.append(dtw_distance(preprocessed[i], preprocessed[j]))
    max_dist = float(np.max(distances))
    return max_dist * multiplier


class MotionSegmenter:
    IDLE = 0
    ACTIVE = 1
    TAIL = 2

    def __init__(
        self,
        energy_threshold: float = 1500.0,
        min_onset_frames: int = 3,
        min_offset_frames: int = 5,
        min_gesture_len: int = 10,
        max_gesture_len: int = 125,
        pre_roll: int = 3,
        cooldown_frames: int = 15,
    ):
        self.energy_threshold = energy_threshold
        self.min_onset_frames = min_onset_frames
        self.min_offset_frames = min_offset_frames
        self.min_gesture_len = min_gesture_len
        self.max_gesture_len = max_gesture_len
        self.pre_roll = pre_roll
        self.cooldown_frames = cooldown_frames

        self._state = self.IDLE
        self._baseline = np.zeros(6, dtype=np.float64)
        self._baseline_initialized = False
        self._onset_count = 0
        self._offset_count = 0
        self._buffer: list[list[int]] = []
        self._pre_buffer: list[list[int]] = []
        self._cooldown_remaining = 0

    def reset(self) -> None:
        self._state = self.IDLE
        self._onset_count = 0
        self._offset_count = 0
        self._buffer = []
        self._pre_buffer = []
        self._cooldown_remaining = 0

    def feed(self, samples: list[list[int]]) -> np.ndarray | None:
        result = None
        for sample in samples:
            seg = self._feed_one(sample)
            if seg is not None:
                result = seg
        return result

    def _feed_one(self, sample: list[int]) -> np.ndarray | None:
        vec = np.array(sample, dtype=np.float64)

        if self._cooldown_remaining > 0:
            self._cooldown_remaining -= 1
            self._update_baseline(vec)
            return None

        energy = self._compute_energy(vec)

        if self._state == self.IDLE:
            self._update_baseline(vec)
            self._pre_buffer.append(sample)
            if len(self._pre_buffer) > self.pre_roll:
                self._pre_buffer.pop(0)

            if energy > self.energy_threshold:
                self._onset_count += 1
                if self._onset_count >= self.min_onset_frames:
                    self._state = self.ACTIVE
                    self._buffer = list(self._pre_buffer)
                    self._pre_buffer = []
                    self._onset_count = 0
            else:
                self._onset_count = 0

        elif self._state == self.ACTIVE:
            self._buffer.append(sample)
            if energy < self.energy_threshold:
                self._offset_count += 1
                if self._offset_count >= self.min_offset_frames:
                    self._state = self.TAIL
            else:
                self._offset_count = 0

            if len(self._buffer) >= self.max_gesture_len:
                self._state = self.IDLE
                self._buffer = []
                self._offset_count = 0
                self._cooldown_remaining = self.cooldown_frames

        elif self._state == self.TAIL:
            # trim the tail silence from buffer
            segment = self._buffer[: len(self._buffer) - self._offset_count]
            self._state = self.IDLE
            self._buffer = []
            self._offset_count = 0
            self._cooldown_remaining = self.cooldown_frames

            if len(segment) >= self.min_gesture_len:
                return np.array(segment)

        return None

    def _compute_energy(self, vec: np.ndarray) -> float:
        diff = vec - self._baseline
        return float(np.sqrt(np.sum(diff**2)))

    def _update_baseline(self, vec: np.ndarray) -> None:
        alpha = 0.05
        if not self._baseline_initialized:
            self._baseline = vec.copy()
            self._baseline_initialized = True
        else:
            self._baseline = (1 - alpha) * self._baseline + alpha * vec


class GestureTemplate:
    def __init__(self, name: str, repetitions: list[np.ndarray], threshold: float):
        self.name = name
        self.repetitions = repetitions
        self.threshold = threshold
        self._preprocessed = [preprocess(r) for r in repetitions]
        self._mean_len = float(np.mean([len(r) for r in repetitions]))


class GestureRecognizer:
    def __init__(self):
        self.templates: dict[str, GestureTemplate] = {}
        self.segmenter = MotionSegmenter()
        self.enabled = False
        self._cooldown_remaining = 0

    def add_template(self, template: GestureTemplate) -> None:
        self.templates[template.name] = template

    def remove_template(self, name: str) -> None:
        self.templates.pop(name, None)

    def feed(self, samples: list[list[int]]) -> tuple[str, float] | None:
        if not self.enabled or not self.templates:
            return None

        if self._cooldown_remaining > 0:
            self._cooldown_remaining -= len(samples)
            # still feed segmenter to keep baseline updated
            for s in samples:
                self.segmenter._feed_one(s)
            return None

        segment = self.segmenter.feed(samples)
        if segment is None:
            return None

        preprocessed = preprocess(segment)
        seg_len = len(segment)
        best_name = ""
        best_distance = float("inf")
        best_threshold = 1.0

        for template in self.templates.values():
            # Length filter: reject if segment length differs too much from template
            ratio = seg_len / template._mean_len
            if ratio < 0.4 or ratio > 2.5:
                continue
            for rep in template._preprocessed:
                dist = dtw_distance(preprocessed, rep)
                if dist < best_distance:
                    best_distance = dist
                    best_name = template.name
                    best_threshold = template.threshold

        if best_distance < best_threshold:
            self._cooldown_remaining = 25
            # Confidence: use quadratic curve for better spread
            ratio = best_distance / best_threshold
            confidence = max(0.0, (1.0 - ratio) ** 0.5)
            return (best_name, confidence)
        return None
