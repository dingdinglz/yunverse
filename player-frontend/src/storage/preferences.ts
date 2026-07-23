import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_BACKEND_BASE_URL,
  DEFAULT_INSTRUMENT,
  DEFAULT_KEY,
  STORAGE_KEYS,
} from '@/config/app-config';
import type { InstrumentCode, KeySignature } from '@/types/domain';

/**
 * 本地偏好存储，见 mobile-client.md §6.7。
 * 读取失败时回退默认值，并在开发模式记录原因。
 */
export interface Preferences {
  backendBaseUrl: string;
  selectedInstrument: InstrumentCode;
  selectedKey: KeySignature;
}

export const DEFAULT_PREFERENCES: Preferences = {
  backendBaseUrl: DEFAULT_BACKEND_BASE_URL,
  selectedInstrument: DEFAULT_INSTRUMENT,
  selectedKey: DEFAULT_KEY,
};

/** 一次性读取全部偏好，缺失或异常时回退默认值。 */
export async function loadPreferences(): Promise<Preferences> {
  try {
    const entries = await AsyncStorage.multiGet([
      STORAGE_KEYS.backendBaseUrl,
      STORAGE_KEYS.selectedInstrument,
      STORAGE_KEYS.selectedKey,
    ]);
    const map = new Map(entries);
    return {
      backendBaseUrl:
        map.get(STORAGE_KEYS.backendBaseUrl) || DEFAULT_PREFERENCES.backendBaseUrl,
      selectedInstrument:
        (map.get(STORAGE_KEYS.selectedInstrument) as InstrumentCode | null) ||
        DEFAULT_PREFERENCES.selectedInstrument,
      selectedKey:
        (map.get(STORAGE_KEYS.selectedKey) as KeySignature | null) ||
        DEFAULT_PREFERENCES.selectedKey,
    };
  } catch (err) {
    if (__DEV__) {
      console.warn('[preferences] 读取失败，使用默认值', err);
    }
    return { ...DEFAULT_PREFERENCES };
  }
}

export async function saveBackendBaseUrl(value: string): Promise<void> {
  await safeSet(STORAGE_KEYS.backendBaseUrl, value);
}

export async function saveSelectedInstrument(value: InstrumentCode): Promise<void> {
  await safeSet(STORAGE_KEYS.selectedInstrument, value);
}

export async function saveSelectedKey(value: KeySignature): Promise<void> {
  await safeSet(STORAGE_KEYS.selectedKey, value);
}

async function safeSet(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (err) {
    if (__DEV__) {
      console.warn(`[preferences] 写入失败 key=${key}`, err);
    }
  }
}
