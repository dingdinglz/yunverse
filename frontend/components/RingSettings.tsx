"use client";

import Link from "next/link";

import ErrorBanner from "@/components/ErrorBanner";
import RingConnectPanel from "@/components/ring/RingConnectPanel";
import RingGesturePanel from "@/components/ring/RingGesturePanel";
import RingMappingPanel from "@/components/ring/RingMappingPanel";
import RingTestPanel from "@/components/ring/RingTestPanel";
import RingVoiceDebugPanel from "@/components/ring/RingVoiceDebugPanel";
import { useRingSettings } from "@/lib/useRingSettings";

export default function RingSettings() {
  const s = useRingSettings();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            戒指设置
          </h1>
          <p className="mt-1 text-sm text-muted">
            连接戒指、录制手势、实时测试
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={[
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium",
              s.streamOnline
                ? "border-ok/30 bg-ok-soft text-ok"
                : "border-danger/30 bg-danger-soft text-danger",
            ].join(" ")}
            role="status"
          >
            <span
              className={`h-2 w-2 rounded-full ${s.streamOnline ? "bg-ok" : "bg-danger"}`}
              aria-hidden
            />
            {s.streamOnline ? "后端在线" : "后端离线"}
          </span>
          <Link
            href="/"
            className="rounded-lg border border-border bg-surface px-3.5 py-1.5 text-sm font-medium text-foreground transition hover:bg-surface-muted"
          >
            返回控制台
          </Link>
        </div>
      </header>

      {s.lastError && <ErrorBanner message={s.lastError} />}

      <RingConnectPanel
        status={s.status}
        busy={s.busy}
        onConnect={s.connect}
        onDisconnect={s.disconnect}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RingGesturePanel
          gestures={s.gestures}
          gestureMethod={s.gestureMethod}
          status={s.status}
          busy={s.busy}
          onDelete={s.removeGesture}
          onBeginRecording={s.beginRecording}
          onRepStart={s.recStart}
          onRepStop={s.recStop}
          onRepCancel={s.recCancel}
        />
        <RingTestPanel
          status={s.status}
          imu={s.imu}
          eventLog={s.eventLog}
          lastRecognition={s.lastRecognition}
          audioFiles={s.audioFiles}
          voiceState={s.voiceState}
          busy={s.busy}
          onToggleRecognition={s.toggleRecognition}
        />
      </div>

      <RingMappingPanel
        gestures={s.gestures}
        mapping={s.mapping}
        techniques={s.techniques}
        busy={s.busy}
        onUpdate={s.updateMapping}
      />

      <RingVoiceDebugPanel />
    </main>
  );
}
