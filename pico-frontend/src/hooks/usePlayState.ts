import { useEffect, useRef, useState } from "react";
import { apiUrl } from "../config";
import type { PlayState, ScoreState } from "../types/play-state";

export type ConnectionStatus = "connecting" | "connected" | "reconnecting";

const RECONNECT_MS = 3000;

interface PlayEvent {
  instrument: PlayState["instrument"];
  key: PlayState["key"];
  note: PlayState["note"];
  technique: PlayState["technique"];
  playback: { status: string };
}

// 直接对接 backend/app/api.py 的 GET /api/v1/state + GET /api/v1/events(SSE)，
// 逻辑对齐 frontend/lib/useDashboardData.ts，但只取 HUD 需要的字段。
export function usePlayState() {
  const [state, setState] = useState<PlayState | null>(null);
  const [scoreState, setScoreState] = useState<ScoreState | null>(null);
  const [connection, setConnection] = useState<ConnectionStatus>("connecting");
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch(apiUrl("/state"));
        const body = await res.json();
        if (mounted && body?.success) setState(body.data as PlayState);
      } catch {
        // SSE 连上后会补上最新状态
      }
    })();

    function connect() {
      const es = new EventSource(apiUrl("/events"));
      esRef.current = es;

      es.onopen = () => {
        if (mounted) setConnection("connected");
      };

      es.onmessage = (ev) => {
        if (!mounted) return;
        try {
          const msg = JSON.parse(ev.data) as { type: string; data: unknown };
          if (msg.type === "state") {
            setState(msg.data as PlayState);
          } else if (msg.type === "play") {
            const item = msg.data as PlayEvent;
            setState({
              instrument: item.instrument,
              key: item.key,
              note: item.note,
              technique: item.technique,
              playback: { status: item.playback.status },
            });
          } else if (msg.type === "score") {
            setScoreState(msg.data as ScoreState);
          }
        } catch {
          // 忽略格式异常的帧
        }
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;
        if (!mounted) return;
        setConnection("reconnecting");
        reconnectTimer.current = setTimeout(connect, RECONNECT_MS);
      };
    }

    connect();

    return () => {
      mounted = false;
      esRef.current?.close();
      esRef.current = null;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, []);

  return { state, scoreState, connection };
}
