import { useCallback, useEffect, useState } from 'react';

import { INSTRUMENTS } from '@/constants/instruments';
import { KEYS } from '@/constants/keys';
import { NOTES } from '@/constants/notes';
import { getConfig } from '@/services/play-service';
import type { Instrument, KeySignature, NoteButton } from '@/types/domain';

interface ConfigState {
  instruments: Instrument[];
  keys: KeySignature[];
  notes: NoteButton[];
  /** 是否使用后端返回的配置（false 表示回退到本地常量）。 */
  fromBackend: boolean;
  loading: boolean;
}

/**
 * 获取枚举配置，见 mobile-client.md §6.4 / api.md §5。
 * - 优先使用后端 config 返回的 instruments（仅 enabled）+ keys。
 * - notes 恒用本地 7 项常量（本期只展示 7 个按钮，忽略后端可能返回的 do_high）。
 * - 请求失败时全部回退本地常量，不阻塞界面。
 */
export function useConfig(baseUrl: string) {
  const [state, setState] = useState<ConfigState>({
    instruments: INSTRUMENTS,
    keys: KEYS,
    notes: NOTES,
    fromBackend: false,
    loading: false,
  });

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const config = await getConfig(baseUrl);
      const enabledInstruments = config.instruments.filter((i) => i.enabled !== false);
      setState({
        instruments: enabledInstruments.length > 0 ? enabledInstruments : INSTRUMENTS,
        keys: config.keys && config.keys.length > 0 ? config.keys : KEYS,
        notes: NOTES, // 恒用本地 7 项，尊重“7 按钮”产品决策。
        fromBackend: true,
        loading: false,
      });
    } catch {
      setState({
        instruments: INSTRUMENTS,
        keys: KEYS,
        notes: NOTES,
        fromBackend: false,
        loading: false,
      });
    }
  }, [baseUrl]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh };
}
