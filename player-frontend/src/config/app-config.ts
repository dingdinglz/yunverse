/**
 * 应用配置文件（可编辑）。
 *
 * 需要修改默认后端地址、请求超时、存储 key 时，直接改这里即可。
 * 运行时用户也可以在界面中修改后端地址，修改后会持久化到 AsyncStorage，
 * 并覆盖此处的默认值。
 */

/** 默认后端地址（不含 /api/v1 前缀）。真机上 localhost 通常无效，请改为局域网 IP。 */
export const DEFAULT_BACKEND_BASE_URL = 'http://localhost:8080';

/** 所有接口统一前缀，见 api.md §2.1。 */
export const API_PREFIX = '/api/v1';

/** 请求超时（毫秒）。超时后按“请求超时”处理。 */
export const REQUEST_TIMEOUT_MS = 8000;

/** 默认乐器 / 音调（本地无记录时使用），见 mobile-client.md §6.1。 */
export const DEFAULT_INSTRUMENT = 'pipa' as const;
export const DEFAULT_KEY = 'C' as const;

/** 本地存储 key，见 mobile-client.md §6.7。 */
export const STORAGE_KEYS = {
  backendBaseUrl: 'virtualInstrument.backendBaseUrl',
  selectedInstrument: 'virtualInstrument.selectedInstrument',
  selectedKey: 'virtualInstrument.selectedKey',
} as const;
