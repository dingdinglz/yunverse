import type { KeySignature } from '@/types/domain';

/**
 * 音调列表，见 mobile-client.md §6.4 / api.md §2.6。
 * 用作后端 config 接口不可用时的回退。
 */
export const KEYS: KeySignature[] = [
  'C',
  'C#',
  'Db',
  'D',
  'D#',
  'Eb',
  'E',
  'F',
  'F#',
  'Gb',
  'G',
  'G#',
  'Ab',
  'A',
  'A#',
  'Bb',
  'B',
];
