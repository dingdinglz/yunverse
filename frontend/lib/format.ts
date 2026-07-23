// 纯函数：展示格式化、历史去重排序、技法名解析。均为无副作用函数，便于单测。

import {
  DEFAULT_INSTRUMENTS,
  DEFAULT_NOTES,
  DEFAULT_TECHNIQUES,
  EMPTY_PLACEHOLDER,
  HISTORY_LIMIT,
  UNKNOWN_TECHNIQUE_NAME,
} from "@/constants/enums";
import type { AppConfig, CodeName, HistoryItem, NoteRef } from "@/types/domain";

/** ISO8601 -> HH:mm:ss（本地时区）。非法/空输入返回占位符，绝不抛错。 */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return EMPTY_PLACEHOLDER;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return EMPTY_PLACEHOLDER;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** 乐器展示名：优先后端 name，其次本地映射，最后回退 code。 */
export function resolveInstrumentName(
  instrument: CodeName | null | undefined,
): string {
  if (!instrument) return EMPTY_PLACEHOLDER;
  if (instrument.name) return instrument.name;
  return DEFAULT_INSTRUMENTS[instrument.code] ?? instrument.code;
}

/** 音符展示 label：优先后端 label，其次本地映射（do_high->do），最后回退 code。 */
export function resolveNoteLabel(note: NoteRef | null | undefined): string {
  if (!note) return EMPTY_PLACEHOLDER;
  if (note.label) return note.label;
  return DEFAULT_NOTES[note.code] ?? note.code;
}

/**
 * 技法展示名（web-frontend.md §6.2）：
 * 技法为空/未知 -> "未知技法"；否则优先后端 name，其次 config，其次本地映射。
 */
export function resolveTechniqueName(
  technique: CodeName | null | undefined,
  config?: AppConfig | null,
): string {
  if (!technique || !technique.code) return UNKNOWN_TECHNIQUE_NAME;
  if (technique.name) return technique.name;
  const fromConfig = config?.techniques.find((t) => t.code === technique.code);
  if (fromConfig?.name) return fromConfig.name;
  return DEFAULT_TECHNIQUES[technique.code] ?? UNKNOWN_TECHNIQUE_NAME;
}

/**
 * 合并历史记录（web-frontend.md §8.3）：
 * 按 eventId 去重，按 createdAt 倒序（最新在前），截断到 limit 条。
 * incoming 优先（覆盖 prev 中同 eventId 的旧值）。
 */
export function mergeHistory(
  prev: HistoryItem[],
  incoming: HistoryItem[],
  limit: number = HISTORY_LIMIT,
): HistoryItem[] {
  const byId = new Map<string, HistoryItem>();
  for (const item of prev) byId.set(item.eventId, item);
  for (const item of incoming) byId.set(item.eventId, item);

  return Array.from(byId.values())
    .sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      const va = Number.isNaN(ta) ? 0 : ta;
      const vb = Number.isNaN(tb) ? 0 : tb;
      return vb - va;
    })
    .slice(0, limit);
}
