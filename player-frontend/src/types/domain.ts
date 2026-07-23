/**
 * 领域数据类型，编码严格对齐 api.md §2.5 / §2.6 / §2.7 / §2.8。
 */

/** 乐器编码，见 api.md §2.5。注意“琵琶”不可写作“枇杷”。 */
export type InstrumentCode = 'guitar' | 'pipa';

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

/**
 * 音符编码，见 api.md §2.7。
 * 后端支持 do_high（高音 do），但本客户端本期只展示 7 个按钮，
 * 类型仍保留 do_high 以便正确解析后端响应。
 */
export type NoteCode = 'do' | 'ri' | 'mi' | 'fa' | 'so' | 'la' | 'xi' | 'do_high';

export interface NoteButton {
  code: NoteCode;
  label: string;
  /** 音级，见 api.md §5.3 notes[].degree。 */
  degree?: number;
}

/** 技法编码，由后端根据戒指手势确定，见 api.md §2.8。 */
export interface Technique {
  code: string;
  name: string;
}
