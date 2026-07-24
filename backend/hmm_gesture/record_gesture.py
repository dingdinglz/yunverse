"""手势数据采集脚本 —— 连接 BLE 戒指实时录制 IMU 数据并保存为训练用 JSON。

支持三种模式:
1. BLE 戒指模式: 连接真实戒指，通过按键控制录制（推荐）
2. 文件模式: 从已有 CSV 文件导入（每行 6 列: ax,ay,az,gx,gy,gz）
3. 交互模式: 从标准输入粘贴数据（适合调试）

用法:
    # 连接戒指录制（推荐）
    python record_gesture.py --name 打响指 --ring --address F1:C1:8A:35:40:FB --reps 5

    # 从 CSV 文件导入
    python record_gesture.py --name 打响指 --from-csv snap1.csv snap2.csv snap3.csv

    # 交互式终端录制
    python record_gesture.py --name 打响指 --interactive --reps 5
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np


def load_csv(path: Path) -> np.ndarray:
    """读取 CSV 文件，每行 6 个整数（加速度 xyz + 陀螺仪 xyz）。"""
    data = np.loadtxt(path, delimiter=",", dtype=np.int16)
    if data.ndim == 1:
        data = data.reshape(1, -1)
    if data.shape[1] != 6:
        raise ValueError(f"{path}: 每行应有 6 列 (ax,ay,az,gx,gy,gz)，实际 {data.shape[1]} 列")
    return data


def read_interactive_rep(rep_index: int) -> np.ndarray:
    """从标准输入读取一次重复的 IMU 数据，空行结束。"""
    print(f"\n--- 第 {rep_index + 1} 次录制 ---")
    print("请粘贴 IMU 数据（每行: ax,ay,az,gx,gy,gz），空行结束:")
    lines = []
    while True:
        line = input()
        if not line.strip():
            break
        lines.append([int(x) for x in line.strip().split(",")])
    if not lines:
        raise ValueError("没有输入数据")
    return np.array(lines, dtype=np.int16)


async def record_from_ring(address: str, name: str, reps: int, output_dir: Path) -> Path:
    """通过 BLE 连接戒指，实时录制 IMU 数据。

    流程:
    1. 连接戒指
    2. 确认戒指在手势模式（IMU 已开启）
    3. 开启 IMU 数据上报
    4. 每次重复: 按下回车开始 -> 再按回车结束
    5. 保存所有重复数据
    """
    sys.path.insert(0, str(Path(__file__).parent / "ring_sdk"))
    import ring_sound as sdk

    print(f"正在连接戒指 {address} ...")
    async with sdk.RingSoundClient(address=address) as ring:
        info = await sdk.get_system_info(ring)
        print(f"已连接: {info.model} (固件 {info.firmware_version}, 电量 {info.battery_percent}%)")

        print("\n请确保戒指处于手势模式（单击按键切换）")
        print("等待按键单击事件...")
        try:
            await sdk.wait_sensor_key_single_press_event(ring, timeout_s=1.0)
            print("检测到按键单击，等待模式切换...")
            await asyncio.sleep(0.5)
        except Exception:
            print("未检测到按键事件，尝试直接开启 IMU...")

        try:
            start_info = await sdk.start_sensor_report(ring)
            print(f"IMU 已开启: 采样率={start_info.sample_rate_hz}Hz, "
                  f"加速度量程={start_info.accel_range_g}g, 陀螺仪量程={start_info.gyro_range_dps}dps")
        except Exception as e:
            print(f"\n错误: 无法开启 IMU 上报 - {e}")
            print("请单击戒指按键切换到手势模式后重试")
            sys.exit(1)

        repetitions: list[np.ndarray] = []
        try:
            print(f"\n手势名称: {name}")
            print(f"需要录制 {reps} 次重复")
            print("操作说明: 按回车开始录制 -> 做手势动作 -> 再按回车结束本次录制\n")

            for i in range(reps):
                input(f"--- 第 {i + 1}/{reps} 次: 按回车开始录制 ---")
                buffer: list[list[int]] = []
                recording = True

                async def collect_data():
                    while recording:
                        try:
                            batch = await sdk.wait_sensor_data(ring, timeout_s=2.0)
                            for sample in batch.samples:
                                buffer.append([
                                    sample.accel_x, sample.accel_y, sample.accel_z,
                                    sample.gyro_x, sample.gyro_y, sample.gyro_z,
                                ])
                        except Exception:
                            if recording:
                                continue
                            break

                task = asyncio.create_task(collect_data())

                await asyncio.get_event_loop().run_in_executor(
                    None, input, "  录制中... 按回车结束本次 "
                )
                recording = False
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

                if len(buffer) < 5:
                    print(f"  警告: 数据太短 ({len(buffer)} 帧)，请重录")
                    i -= 1
                    continue

                rep = np.array(buffer, dtype=np.int16)
                repetitions.append(rep)
                print(f"  已录制: {len(rep)} 帧 ({len(rep) / start_info.sample_rate_hz:.1f}s)")

        finally:
            await sdk.stop_sensor_report(ring)

    if len(repetitions) < 2:
        print(f"错误: 至少需要 2 次重复，当前仅有 {len(repetitions)} 次")
        sys.exit(1)

    path = save_gesture(name, repetitions, output_dir)
    return path


def save_gesture(name: str, repetitions: list[np.ndarray], output_dir: Path) -> Path:
    """保存手势数据为 JSON 格式。"""
    output_dir.mkdir(parents=True, exist_ok=True)
    tz = timezone(timedelta(hours=8))
    data = {
        "name": name,
        "created_at": datetime.now(tz).isoformat(),
        "sample_rate_hz": 25,
        "num_repetitions": len(repetitions),
        "repetitions": [
            {
                "index": i,
                "num_samples": len(rep),
                "data": rep.tolist(),
            }
            for i, rep in enumerate(repetitions)
        ],
    }
    safe_name = name.replace("/", "_").replace("\\", "_")[:64]
    path = output_dir / f"{safe_name}.json"
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def main():
    parser = argparse.ArgumentParser(description="HMM 手势数据采集")
    parser.add_argument("--name", required=True, help="手势名称")
    parser.add_argument("--output", default="gestures", help="输出目录 (默认: gestures/)")
    parser.add_argument("--ring", action="store_true", help="连接 BLE 戒指录制（推荐）")
    parser.add_argument("--address", help="戒指 BLE MAC 地址 (如 F1:C1:8A:35:40:FB)")
    parser.add_argument("--from-csv", nargs="+", metavar="FILE", help="从 CSV 文件导入多次重复")
    parser.add_argument("--interactive", action="store_true", help="交互式从终端输入")
    parser.add_argument("--reps", type=int, default=5, help="录制重复次数 (默认 5)")
    args = parser.parse_args()

    output_dir = Path(args.output)
    repetitions: list[np.ndarray] = []

    if args.ring:
        if not args.address:
            print("错误: 使用 --ring 模式需要指定 --address")
            sys.exit(1)
        path = asyncio.run(record_from_ring(args.address, args.name, args.reps, output_dir))
        print(f"\n保存成功: {path}")
        return

    elif args.from_csv:
        for csv_path in args.from_csv:
            p = Path(csv_path)
            if not p.exists():
                print(f"错误: 文件不存在 {p}")
                sys.exit(1)
            rep = load_csv(p)
            repetitions.append(rep)
            print(f"  已加载: {p.name} ({len(rep)} 帧)")

    elif args.interactive:
        print(f"手势名称: {args.name}")
        print(f"需要录制 {args.reps} 次重复")
        for i in range(args.reps):
            rep = read_interactive_rep(i)
            repetitions.append(rep)
            print(f"  已录制: {len(rep)} 帧")

    else:
        print("错误: 请指定 --ring, --from-csv 或 --interactive")
        sys.exit(1)

    if len(repetitions) < 2:
        print(f"错误: 至少需要 2 次重复，当前仅有 {len(repetitions)} 次")
        sys.exit(1)

    path = save_gesture(args.name, repetitions, output_dir)
    print(f"\n保存成功: {path} ({len(repetitions)} 次重复)")


if __name__ == "__main__":
    main()
