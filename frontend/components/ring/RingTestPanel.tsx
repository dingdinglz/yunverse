"use client";

import Button from "@/components/Button";
import EmptyState from "@/components/EmptyState";
import type { ImuPoint } from "@/lib/useRingSettings";
import type { AudioFileInfo, EventLogItem, RingStatus } from "@/types/ring";

const TONE_TEXT: Record<EventLogItem["tone"], string> = {
  info: "text-muted",
  ok: "text-ok",
  warn: "text-warn",
  danger: "text-danger",
};

function ImuChart({
  data,
  getChannels,
  label,
  yRange = 20000,
}: {
  data: ImuPoint[];
  getChannels: (p: ImuPoint) => [number, number, number];
  label: string;
  yRange?: number;
}) {
  const W = 400;
  const H = 100;
  const n = data.length;

  const toPolyline = (values: number[], color: string) => {
    if (n < 2) return null;
    const points = values
      .map((v, i) => {
        const x = (i / (n - 1)) * W;
        const y = H / 2 - (v / yRange) * (H / 2);
        return `${x.toFixed(1)},${Math.max(0, Math.min(H, y)).toFixed(1)}`;
      })
      .join(" ");
    return (
      <polyline
        key={color}
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.2}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const xs: number[] = [];
  const ys: number[] = [];
  const zs: number[] = [];
  for (const p of data) {
    const [x, y, z] = getChannels(p);
    xs.push(x);
    ys.push(y);
    zs.push(z);
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          {label}
        </span>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded-sm bg-[#ef4444]" />X
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded-sm bg-[#22c55e]" />Y
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded-sm bg-[#3b82f6]" />Z
          </span>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-24 w-full rounded-md bg-surface-muted"
        role="img"
        aria-label={`${label}实时曲线`}
      >
        <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="var(--border)" strokeWidth="0.5" />
        {toPolyline(xs, "#ef4444")}
        {toPolyline(ys, "#22c55e")}
        {toPolyline(zs, "#3b82f6")}
      </svg>
    </div>
  );
}

export default function RingTestPanel({
  status,
  imu,
  eventLog,
  lastRecognition,
  audioFiles,
  voiceState,
  busy,
  onToggleRecognition,
}: {
  status: RingStatus | null;
  imu: ImuPoint[];
  eventLog: EventLogItem[];
  lastRecognition: { name: string; confidence: number } | null;
  audioFiles: AudioFileInfo[];
  voiceState: { state: string; instrument?: string; text?: string; message?: string } | null;
  busy: boolean;
  onToggleRecognition: (enabled: boolean) => void;
}) {
  const connected = status?.connection === "connected";
  const recognitionEnabled = status?.recognitionEnabled ?? false;
  const hasImu = imu.length > 1;

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">测试戒指</h2>
        <Button
          variant={recognitionEnabled ? "secondary" : "primary"}
          size="sm"
          onClick={() => onToggleRecognition(!recognitionEnabled)}
          disabled={busy}
          aria-pressed={recognitionEnabled}
        >
          实时识别：{recognitionEnabled ? "开" : "关"}
        </Button>
      </header>

      {!connected ? (
        <EmptyState
          title="戒指未连接"
          description="先在上方连接戒指，并单击戒指按键进入手势模式，即可实时查看数据。"
        />
      ) : (
        <>
          {/* 实时 IMU — XYZ 三轴曲线 */}
          <div className="flex flex-col gap-4">
            <ImuChart
              data={imu}
              getChannels={(p) => [p.ax, p.ay, p.az]}
              label="加速度"
            />
            <ImuChart
              data={imu}
              getChannels={(p) => [p.gx, p.gy, p.gz]}
              label="陀螺仪"
            />
            {!hasImu && (
              <p className="text-sm text-muted">
                等待 IMU 数据... 若无数据，请单击戒指按键切换到手势模式。
              </p>
            )}
          </div>

          {/* 最近识别结果 */}
          <div className="rounded-xl border border-border bg-surface-muted p-4">
            <span className="text-sm font-medium uppercase tracking-wide text-muted">
              最近识别
            </span>
            {lastRecognition ? (
              <div className="mt-2 flex items-baseline gap-3">
                <span className="text-3xl font-semibold text-foreground">
                  {lastRecognition.name}
                </span>
                <span className="font-mono text-lg text-ok">
                  {Math.round(lastRecognition.confidence * 100)}%
                </span>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">做一个已录制的手势试试。</p>
            )}
          </div>

          {/* 语音指令状态 */}
          {voiceState && (
            <div
              className={[
                "rounded-xl border p-4",
                voiceState.state === "done"
                  ? "border-ok/30 bg-ok-soft"
                  : voiceState.state === "error"
                    ? "border-danger/30 bg-danger-soft"
                    : "border-border bg-surface-muted",
              ].join(" ")}
            >
              <span className="text-sm font-medium uppercase tracking-wide text-muted">
                语音指令
              </span>
              <div className="mt-2 text-sm text-foreground">
                {voiceState.state === "processing" && (
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
                    语音识别中...
                  </span>
                )}
                {voiceState.state === "done" && (
                  <span className="text-ok font-medium">
                    已切换: {voiceState.instrument}
                    {voiceState.text && <span className="ml-2 text-muted font-normal">({voiceState.text})</span>}
                  </span>
                )}
                {voiceState.state === "no_match" && (
                  <span className="text-warn">
                    未匹配指令{voiceState.text && `："${voiceState.text}"`}
                  </span>
                )}
                {voiceState.state === "error" && (
                  <span className="text-danger">{voiceState.message || "语音处理失败"}</span>
                )}
              </div>
            </div>
          )}

          {/* 录音列表 */}
          {audioFiles.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">录音文件</span>
              <ul className="max-h-40 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                {audioFiles.map((f) => (
                  <li
                    key={f.index}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <span className="font-mono text-xs text-foreground">{f.name}</span>
                    <span className="text-xs text-muted">
                      {(f.size / 1024).toFixed(1)} KB
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 事件日志 */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">事件日志</span>
            {eventLog.length > 0 ? (
              <ul className="max-h-64 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                {eventLog.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 px-3 py-2 text-sm"
                  >
                    <span className="shrink-0 font-mono text-xs text-muted">
                      {item.at.slice(11, 19)}
                    </span>
                    <span className={TONE_TEXT[item.tone]}>{item.text}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">
                暂无事件。按键、双击或做手势后，这里会实时记录。
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
