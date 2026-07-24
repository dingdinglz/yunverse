import type { PlayInstrument, PlayNote } from './api';
import type { Technique } from './domain';

/**
 * 推送到眼镜端的演奏状态数据包，见 performance-state-model.md §3。
 */
export interface PlayStatePacket {
  instrument: PlayInstrument;
  key: string;
  note: PlayNote;
  technique: Technique;
  playback: { status: string };
  phase: 'idle' | 'sending' | 'success' | 'error';
}
