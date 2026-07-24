/**
 * API 请求 / 响应类型，严格对齐 api.md。
 * 注意：/play 响应结构以 api.md §6.4 为准（嵌套对象 + audio/playback/warnings），
 * 而非 mobile-client.md §7.5 的简化版。
 */

import type {
  InstrumentCode,
  Instrument,
  KeySignature,
  NoteButton,
  NoteCode,
  Technique,
} from '@/types/domain';

/** 失败响应中的 error 结构，见 api.md §2.3 / §10。 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/** 统一响应格式，见 api.md §2.3。 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  requestId?: string;
}

/** GET /api/v1/health，见 api.md §4.3。 */
export interface HealthData {
  status: string;
  service: string;
  version: string;
  time: string;
}

/** GET /api/v1/config，见 api.md §5.3。 */
export interface ConfigData {
  instruments: Instrument[];
  keys: KeySignature[];
  notes: NoteButton[];
  notesByInstrument?: Record<string, NoteButton[]>;
  techniques: Technique[];
}

/** POST /api/v1/play 请求体，见 api.md §6.2。 */
export interface PlayRequest {
  instrument: InstrumentCode;
  key: KeySignature;
  note: NoteCode;
  loop?: boolean;
}

/** /play 响应中乐器对象，见 api.md §6.4。 */
export interface PlayInstrument {
  code: InstrumentCode;
  name: string;
}

/** /play 响应中音符对象，见 api.md §6.4。 */
export interface PlayNote {
  code: NoteCode;
  label: string;
}

/** /play 响应中音频对象，见 api.md §6.4。 */
export interface PlayAudio {
  path: string;
  format: string;
}

/** /play 响应中播放状态对象，见 api.md §6.4。 */
export interface PlayPlayback {
  played: boolean;
  status: string;
  submittedAt: string;
}

/** POST /api/v1/play 成功响应的 data，见 api.md §6.4。 */
export interface PlayData {
  eventId: string;
  instrument: PlayInstrument;
  key: KeySignature;
  note: PlayNote;
  technique: Technique;
  audio: PlayAudio;
  playback: PlayPlayback;
  warnings: string[];
}
