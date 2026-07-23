import type { ConnectionStatus } from "@/types/domain";

const CONFIG: Record<
  ConnectionStatus,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  connected: {
    label: "已连接",
    dot: "bg-ok",
    text: "text-ok",
    bg: "bg-ok-soft",
    border: "border-ok/30",
  },
  connecting: {
    label: "连接中",
    dot: "bg-info animate-pulse",
    text: "text-info",
    bg: "bg-info-soft",
    border: "border-info/30",
  },
  disconnected: {
    label: "未连接",
    dot: "bg-danger",
    text: "text-danger",
    bg: "bg-danger-soft",
    border: "border-danger/30",
  },
};

export default function ConnectionBadge({
  status,
}: {
  status: ConnectionStatus;
}) {
  const c = CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium ${c.bg} ${c.border} ${c.text}`}
      role="status"
      aria-live="polite"
    >
      <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} aria-hidden />
      {c.label}
    </span>
  );
}
