"use client";

import { useCallback, useEffect, useState } from "react";

import { apiGet } from "@/lib/apiClient";
import type { GestureTemplateInfo, GestureTrigger } from "@/types/ring";

const INSTRUMENTS: Record<string, string> = {
  pipa: "琵琶",
  suona: "唢呐",
  guzheng: "古筝",
  erhu: "二胡",
  dizi: "笛子",
  piano: "钢琴",
  guitar: "吉他",
  violin: "小提琴",
  flute: "长笛",
  bass: "贝斯",
};

const KEYS = ["C", "D", "E", "F", "G", "A", "B"];

interface NoteInfo {
  code: string;
  label: string;
  register: string;
}

export default function RingMappingPanel({
  gestures,
  mapping,
  instrumentMapping,
  triggers,
  techniques,
  busy,
  onUpdate,
  onUpdateInstrument,
  onUpdateTriggers,
}: {
  gestures: GestureTemplateInfo[];
  mapping: Record<string, string>;
  instrumentMapping: Record<string, Record<string, string>>;
  triggers: GestureTrigger[];
  techniques: { code: string; name: string }[];
  busy: boolean;
  onUpdate: (gestureName: string, technique: string | null) => void;
  onUpdateInstrument: (instrument: string, gestureName: string, technique: string | null) => void;
  onUpdateTriggers: (triggers: GestureTrigger[]) => void;
}) {
  const hasGestures = gestures.length > 0;
  const [notesByInstrument, setNotesByInstrument] = useState<Record<string, NoteInfo[]>>({});
  const [expandedInstrument, setExpandedInstrument] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    apiGet<{ notesByInstrument: Record<string, NoteInfo[]> }>("/config", { signal: ctrl.signal })
      .then((data) => setNotesByInstrument(data.notesByInstrument ?? {}))
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  const handleAddTrigger = useCallback(() => {
    const firstGesture = gestures[0]?.name ?? "";
    const newTrigger: GestureTrigger = {
      gesture: firstGesture,
      instrument: "pipa",
      key: "D",
      note: "do",
    };
    onUpdateTriggers([...triggers, newTrigger]);
  }, [gestures, triggers, onUpdateTriggers]);

  const handleRemoveTrigger = useCallback(
    (index: number) => {
      onUpdateTriggers(triggers.filter((_, i) => i !== index));
    },
    [triggers, onUpdateTriggers],
  );

  const handleTriggerChange = useCallback(
    (index: number, field: keyof GestureTrigger, value: string) => {
      const updated = triggers.map((t, i) => (i === index ? { ...t, [field]: value } : t));
      onUpdateTriggers(updated);
    },
    [triggers, onUpdateTriggers],
  );

  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <header>
        <h2 className="text-lg font-semibold text-foreground">手势映射配置</h2>
        <p className="mt-0.5 text-sm text-muted">
          手势切换特殊指法仅影响下一次发音（one-shot）
        </p>
      </header>

      {/* ─── 全局技法映射 ─── */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium text-muted">全局映射</h3>
        {!hasGestures ? (
          <p className="py-4 text-center text-sm text-muted">暂无已录制手势</p>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
            {gestures.map((g) => (
              <div key={g.name} className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="min-w-0 truncate text-sm font-medium text-foreground">
                  {g.name}
                </span>
                <select
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                  value={mapping[g.name] ?? ""}
                  disabled={busy}
                  onChange={(e) => onUpdate(g.name, e.target.value || null)}
                >
                  <option value="">不绑定（默认技法）</option>
                  {techniques
                    .filter((t) => t.code !== "normal")
                    .map((t) => (
                      <option key={t.code} value={t.code}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── 乐器专属映射 ─── */}
      {hasGestures && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-muted">乐器专属映射</h3>
          <p className="text-xs text-muted">针对特定乐器覆盖全局映射，优先级高于全局</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(INSTRUMENTS).map(([code, name]) => {
              const hasOverride = !!instrumentMapping[code] && Object.keys(instrumentMapping[code]).length > 0;
              return (
                <button
                  key={code}
                  type="button"
                  className={[
                    "rounded-lg border px-3 py-1.5 text-sm transition",
                    expandedInstrument === code
                      ? "border-accent bg-accent/10 text-accent font-medium"
                      : hasOverride
                        ? "border-accent/40 bg-surface text-foreground"
                        : "border-border bg-surface text-muted hover:text-foreground",
                  ].join(" ")}
                  onClick={() =>
                    setExpandedInstrument(expandedInstrument === code ? null : code)
                  }
                >
                  {name}
                  {hasOverride && <span className="ml-1 text-xs text-accent">●</span>}
                </button>
              );
            })}
          </div>
          {expandedInstrument && (
            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
              {gestures.map((g) => (
                <div key={g.name} className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="min-w-0 truncate text-sm font-medium text-foreground">
                    {g.name}
                  </span>
                  <select
                    className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                    value={instrumentMapping[expandedInstrument]?.[g.name] ?? ""}
                    disabled={busy}
                    onChange={(e) =>
                      onUpdateInstrument(expandedInstrument, g.name, e.target.value || null)
                    }
                  >
                    <option value="">跟随全局</option>
                    {techniques
                      .filter((t) => t.code !== "normal")
                      .map((t) => (
                        <option key={t.code} value={t.code}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── 手势触发发音 ─── */}
      {hasGestures && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-muted">手势触发发音</h3>
          <p className="text-xs text-muted">手势识别后直接播放指定乐器的音符</p>

          {triggers.length > 0 && (
            <div className="flex flex-col gap-2">
              {triggers.map((trigger, idx) => {
                const instNotes = notesByInstrument[trigger.instrument] ?? [];
                return (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center gap-2 rounded-xl border border-border px-4 py-3"
                  >
                    <select
                      className="rounded-lg border border-border bg-surface px-2 py-1 text-sm disabled:opacity-50"
                      value={trigger.gesture}
                      disabled={busy}
                      onChange={(e) => handleTriggerChange(idx, "gesture", e.target.value)}
                    >
                      {gestures.map((g) => (
                        <option key={g.name} value={g.name}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs text-muted">→</span>
                    <select
                      className="rounded-lg border border-border bg-surface px-2 py-1 text-sm disabled:opacity-50"
                      value={trigger.instrument}
                      disabled={busy}
                      onChange={(e) => handleTriggerChange(idx, "instrument", e.target.value)}
                    >
                      {Object.entries(INSTRUMENTS).map(([code, name]) => (
                        <option key={code} value={code}>
                          {name}
                        </option>
                      ))}
                    </select>
                    <select
                      className="rounded-lg border border-border bg-surface px-2 py-1 text-sm disabled:opacity-50"
                      value={trigger.key}
                      disabled={busy}
                      onChange={(e) => handleTriggerChange(idx, "key", e.target.value)}
                    >
                      {KEYS.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                    <select
                      className="rounded-lg border border-border bg-surface px-2 py-1 text-sm disabled:opacity-50"
                      value={trigger.note}
                      disabled={busy}
                      onChange={(e) => handleTriggerChange(idx, "note", e.target.value)}
                    >
                      {instNotes.length > 0
                        ? instNotes.map((n) => (
                            <option key={n.code} value={n.code}>
                              {n.label}
                              {n.register !== "normal" ? ` (${n.register})` : ""}
                            </option>
                          ))
                        : <option value={trigger.note}>{trigger.note}</option>
                      }
                    </select>
                    <button
                      type="button"
                      className="ml-auto rounded-lg border border-danger/30 px-2 py-1 text-xs text-danger transition hover:bg-danger-soft disabled:opacity-50"
                      disabled={busy}
                      onClick={() => handleRemoveTrigger(idx)}
                    >
                      删除
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            className="self-start rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground transition hover:bg-surface-muted disabled:opacity-50"
            disabled={busy || !hasGestures}
            onClick={handleAddTrigger}
          >
            + 添加触发规则
          </button>
        </div>
      )}
    </section>
  );
}
