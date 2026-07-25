"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiUrl } from "@/lib/apiClient";
import { getConfig, getHistory, getState, getActiveScoreState } from "@/lib/services";
import { getRingStatus } from "@/lib/ringService";
import { mergeHistory } from "@/lib/format";
import { HISTORY_LIMIT } from "@/constants/enums";
import { ApiClientError } from "@/types/api";
import type {
  AppConfig,
  ConnectionStatus,
  CurrentState,
  HistoryItem,
  ScoreState,
} from "@/types/domain";
import type { RingConnection } from "@/types/ring";

const SSE_RECONNECT_MS = 3000;

export interface Selection {
  instrument: string | null;
  key: string | null;
}

export interface DashboardData {
  state: CurrentState | null;
  history: HistoryItem[];
  config: AppConfig | null;
  connection: ConnectionStatus;
  ringConnection: RingConnection;
  lastError: string | null;
  initialLoading: boolean;
  selection: Selection;
  scoreState: ScoreState | null;
}

export function useDashboardData(): DashboardData {
  const [state, setState] = useState<CurrentState | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [connection, setConnection] = useState<ConnectionStatus>("connecting");
  const [ringConnection, setRingConnection] = useState<RingConnection>("disconnected");
  const [lastError, setLastError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selection, setSelection] = useState<Selection>({ instrument: null, key: null });
  const [scoreState, setScoreState] = useState<ScoreState | null>(null);

  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const newController = useCallback(() => new AbortController(), []);

  const refreshConfig = useCallback(async () => {
    try {
      setConfig(await getConfig());
    } catch {
      // fallback to local defaults
    }
  }, []);

  const refreshRingStatus = useCallback(async () => {
    try {
      const rs = await getRingStatus();
      setRingConnection(rs.connection);
    } catch {
      // ignore
    }
  }, []);

  const refreshHistory = useCallback(async () => {
    try {
      const page = await getHistory(HISTORY_LIMIT);
      setHistory((prev) => mergeHistory(prev, page.items, HISTORY_LIMIT));
    } catch {
      // keep old data
    }
  }, []);

  const connectSSE = useCallback(() => {
    if (!mountedRef.current) return;
    if (esRef.current) {
      esRef.current.close();
    }

    const es = new EventSource(apiUrl("/events"));
    esRef.current = es;

    es.onmessage = (ev) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(ev.data) as { type: string; data: unknown };
        if (msg.type === "state") {
          setState(msg.data as CurrentState);
          setConnection("connected");
          setLastError(null);
        } else if (msg.type === "selection") {
          setSelection(msg.data as Selection);
        } else if (msg.type === "technique") {
          const tech = msg.data as { code: string; name: string };
          setState((prev) => prev ? { ...prev, technique: tech } : prev);
        } else if (msg.type === "play") {
          const item = msg.data as HistoryItem;
          setState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              instrument: item.instrument,
              key: item.key,
              note: item.note,
              technique: item.technique,
              playback: {
                status: item.playback.status === "played" ? "played" : prev.playback.status,
                lastPlayedAt: item.createdAt,
                lastEventId: item.eventId,
              },
            };
          });
          setHistory((prev) => mergeHistory(prev, [item], HISTORY_LIMIT));
          setConnection("connected");
          setLastError(null);
        } else if (msg.type === "score") {
          setScoreState(msg.data as ScoreState);
        }
      } catch {
        // malformed SSE frame, ignore
      }
    };

    es.onopen = () => {
      if (!mountedRef.current) return;
      setConnection("connected");
      setLastError(null);
    };

    es.onerror = () => {
      if (!mountedRef.current) return;
      es.close();
      esRef.current = null;
      setConnection("reconnecting");
      setLastError("SSE 连接中断，正在重连…");
      reconnectTimer.current = setTimeout(connectSSE, SSE_RECONNECT_MS);
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      await Promise.allSettled([refreshConfig(), refreshHistory(), refreshRingStatus()]);
      // 初始曲谱状态
      try {
        const s = await getActiveScoreState();
        setScoreState(s);
      } catch { /* ignore */ }
      setInitialLoading(false);
    })();

    connectSSE();

    const ringTimer = setInterval(refreshRingStatus, 5000);

    return () => {
      mountedRef.current = false;
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      clearInterval(ringTimer);
    };
  }, [connectSSE, refreshConfig, refreshHistory, refreshRingStatus]);

  return { state, history, config, connection, ringConnection, lastError, initialLoading, selection, scoreState };
}
