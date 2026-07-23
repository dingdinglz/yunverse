import StatusPill from "@/components/StatusPill";
import {
  formatTime,
  resolveInstrumentName,
  resolveNoteLabel,
  resolveTechniqueName,
} from "@/lib/format";
import { EMPTY_PLACEHOLDER } from "@/constants/enums";
import type { AppConfig, CurrentState } from "@/types/domain";

/** 单个信息块 */
function InfoCard({
  label,
  children,
  primary = false,
}: {
  label: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <span className="text-sm font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
      <div
        className={`mt-3 font-semibold leading-tight text-foreground ${
          primary ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export default function CurrentStateCards({
  state,
  config,
}: {
  state: CurrentState | null;
  config: AppConfig | null;
}) {
  const instrument = resolveInstrumentName(state?.instrument);
  const key = state?.key ?? EMPTY_PLACEHOLDER;
  const technique = state?.technique
    ? resolveTechniqueName(state.technique, config)
    : resolveTechniqueName(null, config);
  const note = resolveNoteLabel(state?.note);
  const playbackStatus = state?.playback.status ?? "idle";
  const lastPlayedAt = formatTime(state?.playback.lastPlayedAt);

  return (
    <section aria-label="当前演奏状态" className="flex flex-col gap-4">
      {/* 主状态：乐器 / 音调 / 技法 — 大字号，便于远距离查看 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InfoCard label="当前乐器" primary>
          {instrument}
        </InfoCard>
        <InfoCard label="当前音调" primary>
          <span className="font-mono">{key}</span>
        </InfoCard>
        <InfoCard label="当前技法" primary>
          {technique}
        </InfoCard>
      </div>

      {/* 次级状态：音符 / 播放状态 / 最近播放时间 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InfoCard label="最近音符">
          <span className="font-mono">{note}</span>
        </InfoCard>
        <InfoCard label="播放状态">
          <StatusPill status={playbackStatus} size="lg" />
        </InfoCard>
        <InfoCard label="最近播放时间">
          <span className="font-mono">{lastPlayedAt}</span>
        </InfoCard>
      </div>
    </section>
  );
}
