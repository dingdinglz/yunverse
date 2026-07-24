"""HMM 手势识别引擎 —— 加载训练好的模型，流式识别。

可作为独立脚本运行，支持:
1. BLE 戒指实时识别（推荐）
2. 从 CSV/JSON 文件离线识别

用法:
    # 连接戒指实时识别（推荐）
    python recognize.py --models pretrained_models/ --ring --address F1:C1:8A:35:40:FB

    # 从 JSON 数据文件离线测试
    python recognize.py --models models/ --input test_data.json

    # 从 CSV 文件离线测试
    python recognize.py --models models/ --input test.csv
"""

from __future__ import annotations

import argparse
import asyncio
import json
import pickle
import sys
from pathlib import Path

import numpy as np

from feature_extractor import FeatureExtractor
from signal_filter import SignalFilter


class MotionSegmenter:
    """基于运动能量的手势分段器。

    从连续 IMU 数据流中检测手势动作的起止：
    - 计算当前帧与基线的欧氏距离作为运动能量
    - 能量超过阈值连续 N 帧 -> 进入 ACTIVE 状态
    - 能量低于阈值连续 M 帧 -> 动作结束，输出片段
    """

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


class HMMRecognizer:
    """基于 Left-Right GaussianHMM 的手势识别器。

    工作流程:
    1. feed() 接收 IMU 数据帧
    2. MotionSegmenter 检测动作片段
    3. SignalFilter 滤波
    4. FeatureExtractor 提取滑窗特征
    5. 对每个已加载模型计算 log-likelihood，选最优
    6. 根据最优与次优的分数差计算置信度
    """

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
        self.enabled = True
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
        print(f"已加载 {len(self._models)} 个模型: {list(self._models.keys())}")

    def feed(self, samples: list[list[int]]) -> tuple[str, float] | None:
        """喂入 IMU 数据帧，有识别结果时返回 (手势名, 置信度)。"""
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


async def run_realtime(model_dir: Path, address: str, sample_rate: float, cutoff_hz: float,
                      window_size: int, window_overlap: int) -> None:
    """实时识别: 连接 BLE 戒指，持续接收 IMU 数据并识别手势。"""
    sys.path.insert(0, str(Path(__file__).parent / "ring_sdk"))
    import ring_sound as sdk

    signal_filter = SignalFilter(sample_rate=sample_rate, cutoff_hz=cutoff_hz)
    extractor = FeatureExtractor(window_size=window_size, overlap=window_overlap)
    recognizer = HMMRecognizer(model_dir, signal_filter, extractor)

    if not recognizer._models:
        print("错误: 没有加载到任何模型")
        sys.exit(1)

    print(f"\n正在连接戒指 {address} ...")
    async with sdk.RingSoundClient(address=address) as ring:
        info = await sdk.get_system_info(ring)
        print(f"已连接: {info.model} (固件 {info.firmware_version}, 电量 {info.battery_percent}%)")

        print("\n请确保戒指处于手势模式（单击按键切换）")
        try:
            await sdk.wait_sensor_key_single_press_event(ring, timeout_s=1.0)
            await asyncio.sleep(0.5)
        except Exception:
            pass

        try:
            start_info = await sdk.start_sensor_report(ring)
            print(f"IMU 已开启: {start_info.sample_rate_hz}Hz")
        except Exception as e:
            print(f"\n错误: 无法开启 IMU - {e}")
            print("请单击戒指按键切换到手势模式后重试")
            sys.exit(1)

        print("\n" + "=" * 50)
        print("实时手势识别已启动，做手势动作即可识别")
        print("按 Ctrl+C 退出")
        print("=" * 50 + "\n")

        count = 0
        try:
            while True:
                try:
                    batch = await sdk.wait_sensor_data(ring, timeout_s=5.0)
                    samples = [
                        [s.accel_x, s.accel_y, s.accel_z, s.gyro_x, s.gyro_y, s.gyro_z]
                        for s in batch.samples
                    ]
                    result = recognizer.feed(samples)
                    if result:
                        name, conf = result
                        count += 1
                        print(f"  [{count:3d}] 识别到: {name}  (置信度={conf:.3f})")
                except sdk.TimeoutError:
                    continue
        except (KeyboardInterrupt, asyncio.CancelledError):
            pass
        finally:
            await sdk.stop_sensor_report(ring)
            print(f"\n已停止，共识别 {count} 次手势")


def run_offline(model_dir: Path, input_path: Path, sample_rate: float, cutoff_hz: float,
                window_size: int, window_overlap: int) -> None:
    """离线测试: 从文件加载数据并直接分类。"""
    signal_filter = SignalFilter(sample_rate=sample_rate, cutoff_hz=cutoff_hz)
    extractor = FeatureExtractor(window_size=window_size, overlap=window_overlap)
    recognizer = HMMRecognizer(model_dir, signal_filter, extractor)

    if input_path.suffix == ".json":
        raw = json.loads(input_path.read_text(encoding="utf-8"))
        if "repetitions" in raw:
            sequences = [rep["data"] for rep in raw["repetitions"]]
        else:
            sequences = [raw["data"]]
    elif input_path.suffix == ".csv":
        data = np.loadtxt(input_path, delimiter=",", dtype=int).tolist()
        sequences = [data]
    else:
        print(f"不支持的文件格式: {input_path.suffix}")
        sys.exit(1)

    print(f"输入文件: {input_path.name}, 共 {len(sequences)} 段数据")
    print("-" * 50)

    for i, seq in enumerate(sequences):
        segment = np.array(seq, dtype=np.int16)
        result = recognizer._classify_segment(segment)
        if result:
            name, conf = result
            print(f"  段 {i}: 识别为 [{name}] 置信度={conf:.3f}")
        else:
            print(f"  段 {i}: 未识别到手势")

    print("-" * 50)


def main():
    parser = argparse.ArgumentParser(description="HMM 手势识别")
    parser.add_argument("--models", default="models", help="模型目录")
    parser.add_argument("--ring", action="store_true", help="连接 BLE 戒指实时识别")
    parser.add_argument("--address", help="戒指 BLE MAC 地址")
    parser.add_argument("--input", help="输入文件 (.json 或 .csv)，离线模式")
    parser.add_argument("--sample-rate", type=float, default=25.0, help="采样率")
    parser.add_argument("--cutoff-hz", type=float, default=10.0, help="低通截止频率")
    parser.add_argument("--window-size", type=int, default=8, help="特征窗口")
    parser.add_argument("--window-overlap", type=int, default=4, help="窗口重叠")
    args = parser.parse_args()

    model_dir = Path(args.models)
    if not model_dir.exists():
        print(f"错误: 模型目录不存在 {model_dir}")
        sys.exit(1)

    if args.ring:
        if not args.address:
            print("错误: 使用 --ring 模式需要指定 --address")
            sys.exit(1)
        asyncio.run(run_realtime(model_dir, args.address, args.sample_rate, args.cutoff_hz,
                                 args.window_size, args.window_overlap))
    elif args.input:
        input_path = Path(args.input)
        if not input_path.exists():
            print(f"错误: 输入文件不存在 {input_path}")
            sys.exit(1)
        run_offline(model_dir, input_path, args.sample_rate, args.cutoff_hz,
                    args.window_size, args.window_overlap)
    else:
        print("错误: 请指定 --ring (实时识别) 或 --input (离线识别)")
        sys.exit(1)


if __name__ == "__main__":
    main()
