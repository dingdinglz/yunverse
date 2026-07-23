import type { NoteButton } from '@/types/domain';

/**
 * 音符按钮，见 mobile-client.md §6.5 / api.md §2.7。
 *
 * 本期确认只展示 7 个按钮（do ri mi fa so la xi），不含高音 do（do_high）。
 * 该列表恒定用作按钮数据源，即使后端 config 返回 do_high 也不展示，
 * 以保证按钮数量符合产品决策。
 */
export const NOTES: NoteButton[] = [
  { code: 'do', label: 'do', degree: 1 },
  { code: 'ri', label: 'ri', degree: 2 },
  { code: 'mi', label: 'mi', degree: 3 },
  { code: 'fa', label: 'fa', degree: 4 },
  { code: 'so', label: 'so', degree: 5 },
  { code: 'la', label: 'la', degree: 6 },
  { code: 'xi', label: 'xi', degree: 7 },
];
