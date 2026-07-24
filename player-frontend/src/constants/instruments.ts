import type { Instrument } from '@/types/domain';

/**
 * 首期支持乐器，见 mobile-client.md §6.3 / api.md §2.5。
 * 展示文案：guitar → 吉他，pipa → 琵琶（不可写作“枇杷”）。
 * 用作后端 config 接口不可用时的回退。
 */
export const INSTRUMENTS: Instrument[] = [
  { code: 'guitar', name: '吉他', enabled: true },
  { code: 'pipa', name: '琵琶', enabled: true },
  { code: 'suona', name: '唢呐', enabled: true },
];
