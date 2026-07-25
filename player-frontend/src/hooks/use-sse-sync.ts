import { useEffect, useRef } from 'react';

import { API_PREFIX } from '@/config/app-config';
import type { ScoreActiveState } from '@/types/domain';

interface SelectionEvent {
  instrument?: string;
  key?: string;
}

/**
 * 监听后端 SSE /api/v1/events，接收远程乐器/音调切换（如语音指令触发）。
 * 使用 fetch + streaming reader 实现，兼容 React Native（无原生 EventSource）。
 */
export function useSseSync(
  baseUrl: string,
  connected: boolean,
  onSelectionChange: (sel: SelectionEvent) => void,
  onScoreChange?: (state: ScoreActiveState) => void,
) {
  const selRef = useRef(onSelectionChange);
  selRef.current = onSelectionChange;
  const scoreRef = useRef(onScoreChange);
  scoreRef.current = onScoreChange;

  useEffect(() => {
    if (!baseUrl || !connected) return;

    const url = `${baseUrl.replace(/\/+$/, '')}${API_PREFIX}/events`;
    let aborted = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let controller: AbortController | null = null;

    function parseSseLine(buffer: string) {
      const lines = buffer.split('\n');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const msg = JSON.parse(line.slice(6));
          if (msg.type === 'selection' && msg.data) {
            selRef.current(msg.data);
          } else if (msg.type === 'score' && msg.data) {
            scoreRef.current?.(msg.data as ScoreActiveState);
          }
        } catch {
          // ignore parse errors
        }
      }
    }

    async function connect() {
      if (aborted) return;
      controller = new AbortController();

      try {
        const response = await fetch(url, {
          headers: { Accept: 'text/event-stream' },
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let partial = '';

        while (!aborted) {
          const { done, value } = await reader.read();
          if (done) break;

          partial += decoder.decode(value, { stream: true });
          const chunks = partial.split('\n\n');
          partial = chunks.pop() ?? '';

          for (const chunk of chunks) {
            parseSseLine(chunk);
          }
        }
      } catch {
        // fetch aborted or network error
      }

      if (!aborted) {
        retryTimer = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      aborted = true;
      controller?.abort();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [baseUrl, connected]);
}
