import { useCallback, useEffect, useState } from 'react';

import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  saveBackendBaseUrl,
  saveSelectedInstrument,
  saveSelectedKey,
  type Preferences,
} from '@/storage/preferences';
import { syncSelection } from '@/services/play-service';
import type { InstrumentCode, KeySignature } from '@/types/domain';

/**
 * 加载并管理本地偏好（后端地址、乐器、音调）。
 * 每次修改都会立即更新状态并持久化，见 mobile-client.md §6.1 / §8.2 / §8.3。
 */
export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    loadPreferences().then((prefs) => {
      if (active) {
        setPreferences(prefs);
        setLoaded(true);
        syncSelection(prefs.backendBaseUrl, {
          instrument: prefs.selectedInstrument,
          key: prefs.selectedKey,
        }).catch(() => {});
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const setBackendBaseUrl = useCallback((value: string) => {
    setPreferences((prev) => ({ ...prev, backendBaseUrl: value }));
    void saveBackendBaseUrl(value);
  }, []);

  const setSelectedInstrument = useCallback((value: InstrumentCode) => {
    setPreferences((prev) => {
      syncSelection(prev.backendBaseUrl, { instrument: value }).catch(() => {});
      return { ...prev, selectedInstrument: value };
    });
    void saveSelectedInstrument(value);
  }, []);

  const setSelectedKey = useCallback((value: KeySignature) => {
    setPreferences((prev) => {
      syncSelection(prev.backendBaseUrl, { key: value }).catch(() => {});
      return { ...prev, selectedKey: value };
    });
    void saveSelectedKey(value);
  }, []);

  return {
    preferences,
    loaded,
    setBackendBaseUrl,
    setSelectedInstrument,
    setSelectedKey,
  };
}
