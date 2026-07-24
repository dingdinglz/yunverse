// 本地默认枚举与兜底映射。
// 当后端 /api/v1/config 暂不可用时（web-frontend.md §10），前端使用这些默认值。

import type { CodeName } from "@/types/domain";

/** 默认乐器（code -> 中文名） */
export const DEFAULT_INSTRUMENTS: Record<string, string> = {
  guitar: "吉他",
  pipa: "琵琶",
};

/** 默认音调（api.md §2.6） */
export const DEFAULT_KEYS: string[] = [
  "C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb",
  "G", "G#", "Ab", "A", "A#", "Bb", "B",
];

/** 默认音符（code -> 展示 label，api.md §2.7；do_high 展示为 do） */
export const DEFAULT_NOTES: Record<string, string> = {
  do: "do",
  ri: "ri",
  mi: "mi",
  fa: "fa",
  so: "so",
  la: "la",
  xi: "xi",
  do_high: "do",
};

/** 默认技法（code -> 中文名，api.md §2.8） */
export const DEFAULT_TECHNIQUES: Record<string, string> = {
  normal: "普通演奏",
  // 预留扩展，以配置接口返回为准
  pluck: "拨弦",
  strum: "扫弦",
  slide: "滑音",
  vibrato: "揉弦",
};

/** 技法未知/为空时的兜底展示（web-frontend.md §6.2） */
export const UNKNOWN_TECHNIQUE_NAME = "未知技法";

/** 空值占位符 */
export const EMPTY_PLACEHOLDER = "—";

/** 历史记录默认展示条数（web-frontend.md §6.3） */
export const HISTORY_LIMIT = 50;

/** 轮询间隔（web-frontend.md §8.2） */
export const STATE_POLL_MS = 1000;
export const HISTORY_POLL_MS = 3000;

/** 请求超时（web-frontend.md §6.5，所有请求应设超时） */
export const REQUEST_TIMEOUT_MS = 4000;

export const DEFAULT_TECHNIQUE_LIST: CodeName[] = Object.entries(
  DEFAULT_TECHNIQUES,
).map(([code, name]) => ({ code, name }));

// --- 戒指设置页 ----------------------------------------------------------
/** 戒指状态轮询间隔（作为 SSE 的兜底，SSE 已推 status） */
export const RING_STATUS_POLL_MS = 3000;
/** 扫描超时（秒） */
export const RING_SCAN_TIMEOUT_S = 5;
/** SSE 事件流路径（相对 /api/v1） */
export const RING_EVENTS_PATH = "/ring/events";
/** 录制默认重复次数 */
export const RING_DEFAULT_REPS = 5;
/** 测试事件日志最大保留条数 */
export const RING_EVENT_LOG_MAX = 60;
/** IMU 实时曲线保留的采样点数 */
export const RING_IMU_WINDOW = 200;
/** 扫描/连接这类长操作的请求超时（ms），需大于扫描时长 */
export const RING_LONG_TIMEOUT_MS = 30000;

