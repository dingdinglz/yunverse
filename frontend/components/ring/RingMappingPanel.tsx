"use client";

import type { GestureTemplateInfo } from "@/types/ring";

export default function RingMappingPanel({
  gestures,
  mapping,
  techniques,
  busy,
  onUpdate,
}: {
  gestures: GestureTemplateInfo[];
  mapping: Record<string, string>;
  techniques: { code: string; name: string }[];
  busy: boolean;
  onUpdate: (gestureName: string, technique: string | null) => void;
}) {
  const hasGestures = gestures.length > 0;

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <header>
        <h2 className="text-lg font-semibold text-foreground">
          手势→技法映射
        </h2>
        <p className="mt-0.5 text-sm text-muted">
          将录制的手势绑定到演奏技法，识别到手势后自动切换
        </p>
      </header>

      {!hasGestures ? (
        <p className="py-6 text-center text-sm text-muted">
          暂无已录制手势，请先录制手势
        </p>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {gestures.map((g) => (
            <div
              key={g.name}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <span className="min-w-0 truncate text-sm font-medium text-foreground">
                {g.name}
              </span>
              <select
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                value={mapping[g.name] ?? ""}
                disabled={busy}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdate(g.name, val || null);
                }}
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
    </section>
  );
}
