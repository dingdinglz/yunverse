# HMM 手势识别系统

基于隐马尔可夫模型 (Hidden Markov Model) 的 IMU 手势识别，适用于可穿戴设备（如智能戒指）的 6 轴 IMU 数据。

## 整体流程

```
连接 BLE 戒指 → 采集 IMU 数据 → 训练 HMM 模型 → 实时/离线识别
```

## 目录结构

```
hmm_gesture/
├── record_gesture.py      # 步骤 1: 数据采集（支持 BLE 戒指/CSV/交互式）
├── train_hmm.py           # 步骤 2: 模型训练
├── recognize.py           # 步骤 3: 手势识别（含完整引擎）
├── signal_filter.py       # 信号预处理（中值滤波 + Butterworth 低通）
├── feature_extractor.py   # 特征提取（滑窗统计特征）
├── requirements.txt       # Python 依赖
├── ring_sdk/              # BLE 戒指通信 SDK
│   ├── ring_sound.py      # SDK 主文件（单文件，直接 import）
│   ├── ring_sound_use.md  # SDK 调用手册
│   ├── protocol.md        # BLE 通信协议
│   └── README.md          # SDK 技术说明
├── sample_data/           # 示例数据（6 个手势）
│   ├── 打响指-hmm.json
│   ├── 甩-hmm.json
│   ├── 向上.json
│   ├── 向下.json
│   ├── 向左.json
│   └── 向右.json
├── pretrained_models/     # 预训练模型（可直接用于识别）
│   ├── 打响指-hmm.pkl
│   ├── 甩-hmm.pkl
│   ├── 向上.pkl
│   ├── 向下.pkl
│   ├── 向左.pkl
│   └── 向右.pkl
└── README.md
```

## 快速开始

### 环境准备

```bash
pip install -r requirements.txt
# 依赖: numpy, scipy, hmmlearn, bleak
```

### 步骤 1: 采集手势数据

每个手势需要录制多次重复（建议 5 次以上），每次重复是一段 6 轴 IMU 数据（加速度 xyz + 陀螺仪 xyz，25Hz 采样）。

```bash
# 方式 A（推荐）: 连接 BLE 戒指实时录制
python record_gesture.py --name 打响指 --ring --address F1:C1:8A:35:40:FB --reps 5

# 方式 B: 从已有 CSV 文件导入（每行 6 个整数: ax,ay,az,gx,gy,gz）
python record_gesture.py --name 打响指 --from-csv snap1.csv snap2.csv snap3.csv

# 方式 C: 交互式从终端输入
python record_gesture.py --name 打响指 --interactive --reps 5
```

**BLE 戒指录制流程:**
1. 连接戒指（需提供 MAC 地址）
2. 确保戒指在手势模式（单击按键切换）
3. 按回车开始录制 → 做手势动作 → 按回车结束
4. 重复 N 次后自动保存

输出到 `gestures/` 目录下的 JSON 文件。

### 步骤 2: 训练模型

```bash
python train_hmm.py --data gestures --output models

# 可选参数:
#   --n-states 6       HMM 隐状态数（默认 6）
#   --sample-rate 25   IMU 采样率 Hz
#   --cutoff-hz 10     低通滤波截止频率
#   --window-size 8    特征窗口大小（帧）
#   --window-overlap 4 窗口重叠（帧）
```

每个手势生成一个 `.pkl` 模型文件到 `models/` 目录。

### 步骤 3: 识别

```bash
# 方式 A（推荐）: 连接 BLE 戒指实时识别
python recognize.py --models pretrained_models --ring --address F1:C1:8A:35:40:FB

# 方式 B: 离线测试
python recognize.py --models pretrained_models --input sample_data/打响指-hmm.json
python recognize.py --models pretrained_models --input sample_data/向上.json
```

**实时识别流程:**
1. 连接戒指，开启 IMU 数据流
2. MotionSegmenter 自动从数据流中检测动作片段
3. 检测到动作后立即进行 HMM 分类并输出结果
4. 持续运行，Ctrl+C 退出

## 预训练模型

`pretrained_models/` 目录包含 6 个已训练好的手势模型，可以直接使用：

| 手势 | 文件 | 说明 |
|------|------|------|
| 打响指 | 打响指-hmm.pkl | 拇指与中指弹响 |
| 甩 | 甩-hmm.pkl | 快速甩手 |
| 向上 | 向上.pkl | 手腕向上挥动 |
| 向下 | 向下.pkl | 手腕向下挥动 |
| 向左 | 向左.pkl | 手腕向左挥动 |
| 向右 | 向右.pkl | 手腕向右挥动 |

## BLE 戒指 SDK

`ring_sdk/` 目录包含完整的戒指通信 SDK（单文件 Python 模块），支持：
- BLE 扫描和连接
- 实时 6 轴 IMU 数据流（25Hz）
- 设备 HMM 手势事件接收
- 系统信息、录音下载等

详细用法见 `ring_sdk/ring_sound_use.md`。

**关键 API:**
```python
import sys; sys.path.insert(0, "ring_sdk")
import ring_sound as sdk

# 连接戒指
async with sdk.RingSoundClient(address="F1:C1:8A:35:40:FB") as ring:
    # 开启 IMU 上报（需戒指在手势模式）
    await sdk.start_sensor_report(ring)
    # 接收数据
    batch = await sdk.wait_sensor_data(ring, timeout_s=5.0)
    for sample in batch.samples:
        print(sample.accel_x, sample.accel_y, sample.accel_z,
              sample.gyro_x, sample.gyro_y, sample.gyro_z)
    await sdk.stop_sensor_report(ring)
```

## 原理简述

### 信号处理 (signal_filter.py)

原始 6 轴 IMU 数据 → 中值滤波（去除脉冲噪声）→ Butterworth 二阶低通滤波（平滑高频抖动）。

### 特征提取 (feature_extractor.py)

滑窗方式提取统计特征，每个窗口输出 24 维向量：
- 均值 (6 维) — 窗口内各轴平均
- 方差 (6 维) — 各轴波动程度
- RMS (6 维) — 各轴能量
- 过零率 (6 维) — 各轴方向变化频率

### 运动分段 (recognize.py 中的 MotionSegmenter)

从连续数据流中自动切出手势片段：
- 计算每帧与基线的欧氏距离作为运动能量
- 能量连续超过阈值 → 动作开始
- 能量连续低于阈值 → 动作结束
- 支持 pre-roll（保留动作前几帧）和 cooldown（防止连续误触发）

### HMM 模型 (train_hmm.py)

采用 Left-Right 拓扑的 Gaussian HMM：
- 状态只能保持或向前转移（不能回退），符合手势的时序特性
- 每个状态的观测服从高斯分布（对角协方差）
- 训练使用 Baum-Welch (EM) 算法
- 推理使用前向算法计算 log-likelihood

### 置信度计算

- 单模型时固定 0.8
- 多模型时: `confidence = 1 - exp(-gap / 10)`，gap 为最高分与次高分之差

## 数据格式

### 手势数据 JSON

```json
{
  "name": "打响指",
  "created_at": "2026-07-24T21:36:09+08:00",
  "sample_rate_hz": 25,
  "num_repetitions": 5,
  "repetitions": [
    {
      "index": 0,
      "num_samples": 45,
      "data": [[ax, ay, az, gx, gy, gz], ...]
    }
  ]
}
```

### CSV 格式

每行 6 个整数，逗号分隔：
```
ax,ay,az,gx,gy,gz
1637,530,-737,1086,476,601
1805,22,-985,647,61,245
...
```

## 关键参数说明

| 参数 | 默认值 | 说明 |
|------|--------|------|
| sample_rate | 25 Hz | IMU 采样率 |
| cutoff_hz | 10 Hz | 低通滤波截止频率 |
| n_states | 6 | HMM 隐状态数（实际会根据数据长度自动缩减） |
| window_size | 8 | 特征提取窗口（帧） |
| window_overlap | 4 | 窗口重叠（帧） |
| energy_threshold | 1500 | 运动能量阈值（用于动作分段） |
| min_gesture_len | 10 | 最小手势长度（帧） |
| max_gesture_len | 125 | 最大手势长度（帧），超过则丢弃 |

## 用示例数据快速验证

```bash
# 用自带的样例数据训练
python train_hmm.py --data sample_data --output models

# 识别验证（用预训练模型）
python recognize.py --models pretrained_models --input sample_data/打响指-hmm.json
python recognize.py --models pretrained_models --input sample_data/向上.json
python recognize.py --models pretrained_models --input sample_data/向左.json
```
