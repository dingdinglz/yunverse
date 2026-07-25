import type { Instrument } from '@/types/domain';

/**
 * 首期支持乐器，见 mobile-client.md §6.3 / api.md §2.5。
 * 展示文案：guitar → 吉他，pipa → 琵琶（不可写作“枇杷”）。
 * 用作后端 config 接口不可用时的回退。
 */
export const INSTRUMENTS: Instrument[] = [
  { code: 'pipa', name: '琵琶', enabled: true },
  { code: 'suona', name: '唢呐', enabled: true },
  { code: 'guzheng', name: '古筝', enabled: true },
  { code: 'erhu', name: '二胡', enabled: true },
  { code: 'dizi', name: '笛子', enabled: true },
  { code: 'piano', name: '钢琴', enabled: true },
  { code: 'guitar', name: '吉他', enabled: true },
  { code: 'violin', name: '小提琴', enabled: true },
  { code: 'flute', name: '长笛', enabled: true },
  { code: 'bass', name: '贝斯', enabled: true },
];
