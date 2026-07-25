// 领域数据类型，严格对齐 ../api.md 各接口的实际响应结构。
// 注意：与 web-frontend.md §7 的 TS 接口存在差异，此处以 api.md 为准。

export type InstrumentCode = "guitar" | "pipa";
export type PlaybackStatus = "idle" | "played" | "failed";
export type HistoryStatus = "played" | "failed";

/** code/name 二元组，乐器与技法通用 */
export interface CodeName {
  code: string;
  name: string;
}

/** 音符：api.md 中 note 为对象 { code, label } */
export interface NoteRef {
  code: string;
  label: string;
}

/** GET /api/v1/health -> data */
export interface Health {
  status: string;
  service: string;
  version: string;
  time: string;
}

/** GET /api/v1/config -> data */
export interface AppConfig {
  instruments: { code: string; name: string; enabled: boolean }[];
  keys: string[];
  notes: { code: string; label: string; degree: number }[];
  techniques: CodeName[];
}

/** GET /api/v1/state -> data（空闲时各字段可能为 null） */
export interface CurrentState {
  instrument: CodeName | null;
  key: string | null;
  note: NoteRef | null;
  technique: CodeName | null;
  playback: {
    status: PlaybackStatus;
    lastPlayedAt: string | null;
    lastEventId: string | null;
  };
  ring: {
    connected: boolean;
    deviceId: string | null;
    gestureCode: string | null;
    confidence: number | null;
    updatedAt: string | null;
  };
}

/** GET /api/v1/history -> data.items[] */
export interface HistoryItem {
  eventId: string;
  instrument: CodeName;
  key: string;
  note: NoteRef;
  technique: CodeName;
  audio?: { path: string; format: string };
  playback: { status: HistoryStatus; played: boolean };
  warnings: string[];
  createdAt: string;
}

/** GET /api/v1/history -> data */
export interface HistoryPage {
  items: HistoryItem[];
  nextCursor: string | null;
}

/** 连接状态（前端派生，非后端字段） */
export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "reconnecting";

/** 曲谱模式 SSE 推送的单个音符 */
export interface ScoreNote {
  code: string;
  index: number;
  active: boolean;
  lyric?: string;
  duration?: number;
}

/** 曲谱模式活跃状态（SSE "score" 事件 data） */
export interface ScoreState {
  active: boolean;
  scoreId?: string | null;
  title?: string;
  instrument?: string;
  key?: string;
  tempo?: number;
  currentIndex: number;
  totalNotes: number;
  notes: ScoreNote[];
}

/** 完整曲谱详情（GET /api/v1/scores/:id） */
export interface ScoreDetail {
  id: string;
  title: string;
  key: string;
  timeSignature?: string;
  tempo?: number;
  instrument: string;
  notes: { code: string; duration: number; lyric?: string }[];
}
