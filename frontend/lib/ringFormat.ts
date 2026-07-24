// 戒指测试事件的纯展示辅助（可单测）。

import type {
  DeviceEvent,
  EventLogItem,
  ImuSample,
  RecognitionEvent,
  RecordingEvent,
} from "@/types/ring";

/** 加速度/陀螺仪三轴合成幅值（用于实时曲线）。 */
export function imuMagnitude(sample: ImuSample): { accel: number; gyro: number } {
  const [ax, ay, az, gx, gy, gz] = sample;
  return {
    accel: Math.sqrt(ax * ax + ay * ay + az * az),
    gyro: Math.sqrt(gx * gx + gy * gy + gz * gz),
  };
}

/** 把设备事件转成日志文案 + 语气色。 */
export function describeDeviceEvent(ev: DeviceEvent): { text: string; tone: EventLogItem["tone"] } {
  const d = ev.data;
  switch (d.kind) {
    case "key_single":
      return { text: "按键单击（切换手势/录音模式）", tone: "info" };
    case "double_tap":
      return { text: "六轴双击", tone: "info" };
    case "hmm_gesture":
      return { text: `内置手势：${d.name ?? d.gestureId ?? "?"}`, tone: "info" };
    case "info":
      return { text: d.message ?? "提示", tone: "warn" };
    case "error":
      return { text: d.message ?? "错误", tone: "danger" };
    default:
      return { text: d.message ?? d.kind, tone: "info" };
  }
}

export function describeRecognition(ev: RecognitionEvent): { text: string; tone: EventLogItem["tone"] } {
  const pct = Math.round(ev.data.confidence * 100);
  return { text: `识别到手势「${ev.data.name}」（${pct}%）`, tone: "ok" };
}

/** 录制状态机 -> 用户可读提示。 */
export function describeRecording(ev: RecordingEvent): string {
  const d = ev.data;
  switch (d.state) {
    case "started":
      return `开始录制「${d.name}」，共 ${d.targetReps} 次`;
    case "rep_recording":
      return `正在录制第 ${(d.currentRep ?? 0) + 1} 次...`;
    case "rep_saved":
      return `已保存第 ${d.currentRep}/${d.targetReps} 次`;
    case "rep_too_short":
      return d.message ?? "录制太短，请重录本次";
    case "done":
      return `手势「${d.name}」录制完成（${d.sampleCount} 样本）`;
    case "cancelled":
      return "录制已取消";
    default:
      return d.state;
  }
}
