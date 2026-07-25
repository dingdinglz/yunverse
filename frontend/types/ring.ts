// 戒指设置页相关的领域类型，对齐后端 app/ring_manager.py 的返回结构与
// app/ring_api.py 的 SSE 事件（type: status | imu | event | recognition | recording）。

export type RingConnection = "disconnected" | "connecting" | "connected" | "reconnecting";
export type RingMode = "gesture" | "recording" | null;

/** GET /api/v1/ring/status -> data */
export interface RingDeviceInfo {
  firmwareVersion: string;
  model: string;
  sn: string;
  cpuid: string;
  batteryPercent: number;
  batteryCharging: boolean;
  audioStorageTotal: number;
  audioStorageAvailable: number;
  systemTime: number;
}

export interface RecordingState {
  name: string;
  targetReps: number;
  currentRep: number;
  active: boolean;
  message?: string;
}

export interface RingStatus {
  connection: RingConnection;
  address: string | null;
  mode: RingMode;
  deviceInfo: RingDeviceInfo | null;
  recognitionEnabled: boolean;
  recording: RecordingState | null;
  gestureCount: number;
}

/** POST /api/v1/ring/scan -> data.devices[] */
export interface RingDevice {
  address: string;
  name: string | null;
  rssi: number | null;
}

/** GET /api/v1/ring/gestures -> data.gestures[] */
export interface GestureTemplateInfo {
  name: string;
  type: "dtw" | "hmm";
  sampleCount?: number;
  threshold?: number;
}

/** 一个 IMU 采样：[ax, ay, az, gx, gy, gz]（int16） */
export type ImuSample = [number, number, number, number, number, number];

// --- SSE 实时事件（/api/v1/ring/events） ---------------------------------
export interface RingEventBase {
  at: string;
}

export interface StatusEvent extends RingEventBase {
  type: "status";
  data: RingStatus;
}

export interface ImuEvent extends RingEventBase {
  type: "imu";
  data: { samples: ImuSample[]; count: number };
}

export interface DeviceEvent extends RingEventBase {
  type: "event";
  data: {
    kind: string; // key_single | double_tap | hmm_gesture | info | error
    ts?: number | null;
    gestureId?: number;
    name?: string;
    message?: string;
  };
}

export interface RecognitionEvent extends RingEventBase {
  type: "recognition";
  data: { name: string; confidence: number };
}

export interface RecordingEvent extends RingEventBase {
  type: "recording";
  data: {
    state: string; // started | rep_recording | rep_saved | rep_too_short | done | cancelled
    name?: string;
    targetReps?: number;
    currentRep?: number;
    active?: boolean;
    message?: string;
    sampleCount?: number;
    threshold?: number;
  };
}

export interface AudioEvent extends RingEventBase {
  type: "audio";
  data: {
    state: "received" | "raw";
    index: number;
    path: string;
    name: string;
    size: number;
  };
}

export interface AudioFileInfo {
  index: number;
  path: string;
  name: string;
  size: number;
}

export interface VoiceEvent extends RingEventBase {
  type: "voice";
  data: {
    state: "processing" | "done" | "no_match" | "error";
    phase?: "asr" | "intent";
    instrument?: string;
    text?: string;
    reason?: string;
    message?: string;
  };
}

export type RingEvent =
  | StatusEvent
  | ImuEvent
  | DeviceEvent
  | RecognitionEvent
  | RecordingEvent
  | AudioEvent
  | VoiceEvent;

/** 单条测试事件日志项（前端派生） */
export interface EventLogItem {
  id: string;
  at: string;
  text: string;
  tone: "info" | "ok" | "warn" | "danger";
}

/** 手势触发发音配置项 */
export interface GestureTrigger {
  gesture: string;
  instrument: string;
  key: string;
  note: string;
}
