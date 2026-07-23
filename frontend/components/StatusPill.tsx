import type { PlaybackStatus } from "@/types/domain";

const CONFIG: Record<
  PlaybackStatus,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  played: {
    label: "成功",
    dot: "bg-ok",
    text: "text-ok",
    bg: "bg-ok-soft",
    border: "border-ok/30",
  },
  failed: {
    label: "失败",
    dot: "bg-danger",
    text: "text-danger",
    bg: "bg-danger-soft",
    border: "border-danger/30",
  },
  idle: {
    label: "空闲",
    dot: "bg-muted",
    text: "text-muted",
    bg: "bg-surface-muted",
    border: "border-border",
  },
};

export default function StatusPill({
  status,
  size = "sm",
}: {
  status: PlaybackStatus;
  size?: "sm" | "lg";
}) {
  const c = CONFIG[status];
  const dims =
    size === "lg" ? "px-3 py-1.5 text-base" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${dims} ${c.bg} ${c.border} ${c.text}`}
    >
      <span className={`h-2 w-2 rounded-full ${c.dot}`} aria-hidden />
      {c.label}
    </span>
  );
}
