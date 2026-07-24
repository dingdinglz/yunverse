"use client";

import Link from "next/link";

import ConnectionBadge from "@/components/ConnectionBadge";
import CurrentStateCards from "@/components/CurrentStateCards";
import ErrorBanner from "@/components/ErrorBanner";
import HistoryTable from "@/components/HistoryTable";
import SkeletonDashboard from "@/components/SkeletonDashboard";
import { useDashboardData } from "@/lib/useDashboardData";

export default function Dashboard() {
  const { state, history, config, connection, lastError, initialLoading } =
    useDashboardData();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8">
      {/* 顶部标题栏 */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            虚拟乐器演奏控制台
          </h1>
          <p className="mt-1 text-sm text-muted">
            实时监控当前演奏状态与历史记录
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="rounded-lg border border-border bg-surface px-3.5 py-1.5 text-sm font-medium text-foreground transition hover:bg-surface-muted"
          >
            戒指设置
          </Link>
          <ConnectionBadge status={connection} />
        </div>
      </header>

      {/* 错误提示：仅在断连且已有过数据时展示（首屏加载不打扰） */}
      {connection === "disconnected" && lastError && !initialLoading && (
        <ErrorBanner message={lastError} />
      )}

      {initialLoading ? (
        <SkeletonDashboard />
      ) : (
        <>
          <CurrentStateCards state={state} config={config} />
          <HistoryTable items={history} config={config} />
        </>
      )}
    </main>
  );
}
