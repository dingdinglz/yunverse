"use client";

import { useEffect, useRef, useState } from "react";

import { getScore } from "@/lib/services";
import type { ScoreDetail, ScoreState } from "@/types/domain";

const CODE_TO_JIANPU: Record<string, string> = {
  do: "1", ri: "2", mi: "3", fa: "4", so: "5", la: "6", xi: "7",
  do_low: "1\u0323", ri_low: "2\u0323", mi_low: "3\u0323", fa_low: "4\u0323",
  so_low: "5\u0323", la_low: "6\u0323", xi_low: "7\u0323",
  do_high: "1\u0307", ri_high: "2\u0307", mi_high: "3\u0307", fa_high: "4\u0307",
  so_high: "5\u0307", la_high: "6\u0307", xi_high: "7\u0307",
};

function toJianpu(code: string): string {
  return CODE_TO_JIANPU[code] ?? code;
}

export default function ScoreDisplay({ scoreState }: { scoreState: ScoreState }) {
  const [detail, setDetail] = useState<ScoreDetail | null>(null);
  const loadedId = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scoreState.active || !scoreState.scoreId) {
      setDetail(null);
      loadedId.current = null;
      return;
    }
    if (loadedId.current === scoreState.scoreId) return;
    loadedId.current = scoreState.scoreId;
    const ctrl = new AbortController();
    getScore(scoreState.scoreId, ctrl.signal)
      .then(setDetail)
      .catch(() => {});
    return () => ctrl.abort();
  }, [scoreState.active, scoreState.scoreId]);

  useEffect(() => {
    if (!containerRef.current) return;
    const active = containerRef.current.querySelector("[data-active='true']");
    if (active) {
      active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [scoreState.currentIndex]);

  if (!scoreState.active || !detail) return null;

  const progress = scoreState.totalNotes > 0
    ? Math.round((scoreState.currentIndex / scoreState.totalNotes) * 100)
    : 0;

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">{detail.title}</h2>
          <span className="text-sm text-muted">
            1={detail.key} {detail.timeSignature ?? "4/4"} {detail.tempo ? `\u2669=${detail.tempo}` : ""}
          </span>
        </div>
        <span className="text-sm font-medium text-accent">
          {scoreState.currentIndex + 1} / {scoreState.totalNotes}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Score notes */}
      <div ref={containerRef} className="flex flex-wrap gap-x-0.5 gap-y-3 pt-2">
        {detail.notes.map((note, idx) => {
          const isCurrent = idx === scoreState.currentIndex;
          const isPast = idx < scoreState.currentIndex;
          return (
            <div
              key={idx}
              data-active={isCurrent}
              className={[
                "flex flex-col items-center px-1 py-0.5 rounded transition-all",
                isCurrent
                  ? "bg-accent/15 ring-2 ring-accent scale-110"
                  : isPast
                    ? "opacity-40"
                    : "",
              ].join(" ")}
            >
              <span
                className={[
                  "text-lg font-mono leading-tight",
                  isCurrent ? "text-accent font-bold" : "text-foreground",
                ].join(" ")}
              >
                {toJianpu(note.code)}
              </span>
              {note.lyric && (
                <span
                  className={[
                    "text-xs leading-tight mt-0.5",
                    isCurrent ? "text-accent" : "text-muted",
                  ].join(" ")}
                >
                  {note.lyric}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
