"use client";

import { useState } from "react";

import Button from "@/components/Button";
import EmptyState from "@/components/EmptyState";
import Input from "@/components/Input";
import { RING_DEFAULT_REPS } from "@/constants/enums";
import type { GestureTemplateInfo, RingStatus } from "@/types/ring";

export default function RingGesturePanel({
  gestures,
  status,
  busy,
  onDelete,
  onBeginRecording,
  onRepStart,
  onRepStop,
  onRepCancel,
}: {
  gestures: GestureTemplateInfo[];
  status: RingStatus | null;
  busy: boolean;
  onDelete: (name: string) => void;
  onBeginRecording: (name: string, reps: number) => void;
  onRepStart: () => void;
  onRepStop: () => void;
  onRepCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [reps, setReps] = useState(RING_DEFAULT_REPS);

  const connected = status?.connection === "connected";
  const inGestureMode = status?.mode === "gesture";
  const recording = status?.recording ?? null;

  const canStart = connected && inGestureMode && !recording && name.trim().length > 0;

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">配置手势</h2>
        <span className="text-sm text-muted">共 {gestures.length} 个</span>
      </header>

      {/* 已保存手势列表 */}
      {gestures.length > 0 ? (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {gestures.map((g) => (
            <li
              key={g.name}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <span className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{g.name}</span>
                <span className="font-mono text-xs text-muted">
                  {g.sampleCount} 样本 · 阈值 {g.threshold.toFixed(2)}
                </span>
              </span>
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDelete(g.name)}
                disabled={busy}
              >
                删除
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="暂无自定义手势"
          description="连接戒指并切换到手势模式后，即可录制第一个手势。"
        />
      )}

      {/* 录制区 */}
      <div className="rounded-xl border border-border bg-surface-muted p-4">
        {recording ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-foreground">
                录制「{recording.name}」
              </span>
              <span className="font-mono text-sm text-muted">
                第 {Math.min(recording.currentRep + 1, recording.targetReps)}/
                {recording.targetReps} 次
              </span>
            </div>
            {recording.message && (
              <p className="text-sm text-warn">{recording.message}</p>
            )}
            <p className="text-sm text-muted">
              {recording.active
                ? "正在采集本次动作，完成后点击“完成本次”。"
                : "点击“开始本次”，做一次手势动作。"}
            </p>
            <div className="flex flex-wrap gap-2">
              {recording.active ? (
                <Button onClick={onRepStop} disabled={busy}>
                  完成本次
                </Button>
              ) : (
                <Button onClick={onRepStart} disabled={busy}>
                  开始本次
                </Button>
              )}
              <Button variant="ghost" onClick={onRepCancel} disabled={busy}>
                取消录制
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
              <Input
                label="手势名称"
                placeholder="例如：转圈"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="重复次数"
                type="number"
                min={2}
                max={20}
                value={reps}
                onChange={(e) =>
                  setReps(
                    Math.max(2, Math.min(20, Number(e.target.value) || RING_DEFAULT_REPS)),
                  )
                }
                className="sm:w-28"
              />
            </div>
            <div>
              <Button
                onClick={() => onBeginRecording(name.trim(), reps)}
                disabled={!canStart || busy}
              >
                开始录制
              </Button>
            </div>
            {!connected ? (
              <p className="text-sm text-muted">连接戒指后才能录制手势。</p>
            ) : !inGestureMode ? (
              <p className="text-sm text-warn">
                戒指当前不在手势模式，请单击戒指按键切换后再录制。
              </p>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
