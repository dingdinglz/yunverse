/**
 * 领域数据类型，编码严格对齐 api.md §2.5 / §2.6 / §2.7 / §2.8。
 */

/** 乐器编码，见 api.md §2.5。注意”琵琶”不可写作”枇杷”。 */
export type InstrumentCode = 'pipa' | 'suona' | 'guzheng' | 'erhu' | 'dizi'
  | 'piano' | 'guitar' | 'violin' | 'flute' | 'bass';

export interface Instrument {
  code: InstrumentCode;
  name: string;
  /** 后端 config 接口返回是否启用，见 api.md §5.3。 */
  enabled?: boolean;
}

/** 音调编码，见 api.md §2.6。 */
export type KeySignature =
  | 'C'
  | 'C#'
  | 'Db'
  | 'D'
  | 'D#'
  | 'Eb'
  | 'E'
  | 'F'
  | 'F#'
  | 'Gb'
  | 'G'
  | 'G#'
  | 'Ab'
  | 'A'
  | 'A#'
  | 'Bb'
  | 'B';

export type NoteRegister = 'low' | 'normal' | 'high';

export type NoteCode =
  | 'do' | 'ri' | 'mi' | 'fa' | 'so' | 'la' | 'xi'
  | 'do_low' | 'ri_low' | 'mi_low' | 'fa_low' | 'so_low' | 'la_low' | 'xi_low'
  | 'do_high' | 'ri_high' | 'mi_high' | 'fa_high' | 'so_high' | 'la_high' | 'xi_high';

export interface NoteButton {
  code: NoteCode;
  label: string;
  /** 音级，见 api.md §5.3 notes[].degree。 */
  degree?: number;
  register?: NoteRegister;
}

/** 技法编码，由后端根据戒指手势确定，见 api.md §2.8。 */
export interface Technique {
  code: string;
  name: string;
}

/** 曲谱模式 SSE 推送的单个音符 */
export interface ScoreNote {
  code: string;
  index: number;
  active: boolean;
  lyric?: string;
  duration?: number;
}

/** 曲谱模式活跃状态（SSE "score" 事件 data） */
export interface ScoreActiveState {
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
