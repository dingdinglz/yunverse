"use client";

// 仪表盘数据编排 hook：
// - 挂载即并行拉取 health + state + history（web-frontend.md §8.1）
// - 之后 state 每 1s、history 每 3s 轮询（§8.2）
// - 请求失败不清空旧数据，仅置连接状态为 disconnected（§8.4）
// - 卸载时清定时器并中断在途请求

import { useCallback, useEffect, useRef, useState } from "react";
import { getConfig, getHistory, getState } from "@/lib/services";
import { mergeHistory } from "@/lib/format";
import {
  HISTORY_LIMIT,
  HISTORY_POLL_MS,
  STATE_POLL_MS,
} from "@/constants/enums";
import { ApiClientError } from "@/types/api";
import type {
  AppConfig,
  ConnectionStatus,
  CurrentState,
  HistoryItem,
} from "@/types/domain";

export interface DashboardData {
  state: CurrentState | null;
  history: HistoryItem[];
  config: AppConfig | null;
  connection: ConnectionStatus;
  /** 最近一次错误信息（用于 ErrorBanner）；连接恢复后清空 */
  lastError: string | null;
  /** 首屏是否仍在加载（尚未拿到任何一次成功数据） */
  initialLoading: boolean;
}

export function useDashboardData(): DashboardData {
  const [state, setState] = useState<CurrentState | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [connection, setConnection] = useState<ConnectionStatus>("connecting");
  const [lastError, setLastError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // 在途请求的 abort 控制器集合，卸载时统一中断
  const controllersRef = useRef<Set<AbortController>>(new Set());

  const newController = useCallback(() => {
    const c = new AbortController();
    controllersRef.current.add(c);
    return c;
  }, []);

  const releaseController = useCallback((c: AbortController) => {
    controllersRef.current.delete(c);
  }, []);

  const toErrorMessage = useCallback((err: unknown): string => {
    if (err instanceof ApiClientError) return err.message;
    return "未知错误";
  }, []);

  // 拉取当前状态：成功 -> connected + 清错误；失败 -> disconnected + 记错误（保留旧数据）
  const refreshState = useCallback(async () => {
    const c = newController();
    try {
      const next = await getState(c.signal);
      setState(next);
      setConnection("connected");
      setLastError(null);
    } catch (err) {
      if (c.signal.aborted) return;
      setConnection("disconnected");
      setLastError(toErrorMessage(err));
    } finally {
      releaseController(c);
    }
  }, [newController, releaseController, toErrorMessage]);

  // 拉取历史：合并去重排序（保留旧数据，失败不清空）
  const refreshHistory = useCallback(async () => {
    const c = newController();
    try {
      const page = await getHistory(HISTORY_LIMIT, c.signal);
      setHistory((prev) => mergeHistory(prev, page.items, HISTORY_LIMIT));
    } catch {
      // 历史失败不改连接状态（以 state 轮询为准），保留旧列表
    } finally {
      releaseController(c);
    }
  }, [newController, releaseController]);

  // 拉取配置（用于技法名映射），失败则回退本地默认枚举
  const refreshConfig = useCallback(async () => {
    const c = newController();
    try {
      setConfig(await getConfig(c.signal));
    } catch {
      // 忽略：resolveTechniqueName 会回退到本地默认
    } finally {
      releaseController(c);
    }
  }, [newController, releaseController]);

  useEffect(() => {
    let stateTimer: ReturnType<typeof setInterval> | null = null;
    let historyTimer: ReturnType<typeof setInterval> | null = null;
    const controllers = controllersRef.current;

    // 首屏：并行拉取，结束后关闭初始 loading
    (async () => {
      await Promise.allSettled([refreshConfig(), refreshState(), refreshHistory()]);
      setInitialLoading(false);
    })();

    stateTimer = setInterval(refreshState, STATE_POLL_MS);
    historyTimer = setInterval(refreshHistory, HISTORY_POLL_MS);

    return () => {
      if (stateTimer) clearInterval(stateTimer);
      if (historyTimer) clearInterval(historyTimer);
      controllers.forEach((c) => c.abort());
      controllers.clear();
    };
  }, [refreshConfig, refreshState, refreshHistory]);

  return { state, history, config, connection, lastError, initialLoading };
}
