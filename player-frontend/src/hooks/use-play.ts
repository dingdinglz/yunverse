import { useCallback, useState } from 'react';

import { AppError, unknownError } from '@/services/errors';
import { play, stopPlay as stopPlayApi } from '@/services/play-service';
import type { PlayData, PlayRequest } from '@/types/api';
import type { NoteCode } from '@/types/domain';

export type PlayPhase = 'idle' | 'sending' | 'success' | 'error';

export interface RecentPlay {
  instrumentName: string;
  key: string;
  noteLabel: string;
  techniqueName: string;
  warnings: string[];
}

/**
 * 触发演奏并维护反馈状态，见 mobile-client.md §6.2 / §8.4 / §10。
 * - pendingNote：当前正在请求的按钮 code，用于按钮短暂 loading（不全局禁用）。
 * - recent：最近一次成功演奏信息。
 * - errorMessage：失败时的中文文案。
 */
export function usePlay(baseUrl: string) {
  const [phase, setPhase] = useState<PlayPhase>('idle');
  const [pendingNote, setPendingNote] = useState<NoteCode | null>(null);
  const [recent, setRecent] = useState<RecentPlay | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const triggerPlay = useCallback(
    async (payload: PlayRequest) => {
      setPendingNote(payload.note);
      setPhase('sending');
      setErrorMessage(null);
      try {
        const data: PlayData = await play(baseUrl, payload);
        setRecent({
          instrumentName: data.instrument.name,
          key: data.key,
          noteLabel: data.note.label,
          techniqueName: data.technique.name,
          warnings: data.warnings ?? [],
        });
        setPhase('success');
      } catch (err) {
        const appError = err instanceof AppError ? err : unknownError(err);
        setErrorMessage(appError.message);
        setPhase('error');
      } finally {
        setPendingNote(null);
      }
    },
    [baseUrl],
  );

  const stopPlay = useCallback(async () => {
    try {
      await stopPlayApi(baseUrl);
    } catch {
      // best-effort
    }
  }, [baseUrl]);

  return { phase, pendingNote, recent, errorMessage, triggerPlay, stopPlay };
}
