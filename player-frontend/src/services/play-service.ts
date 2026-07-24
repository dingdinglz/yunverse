import { request } from '@/services/api-client';
import type { ConfigData, HealthData, PlayData, PlayRequest } from '@/types/api';

/**
 * 演奏相关 API，见 api.md §4 / §5 / §6。
 * 所有方法接收 baseUrl（后端根地址，不含 /api/v1），由调用方从偏好中传入。
 */

/** GET /api/v1/health —— 健康检查，见 api.md §4。 */
export function checkHealth(baseUrl: string): Promise<HealthData> {
  return request<HealthData>(baseUrl, '/health');
}

/** GET /api/v1/config —— 获取枚举配置，见 api.md §5。 */
export function getConfig(baseUrl: string): Promise<ConfigData> {
  return request<ConfigData>(baseUrl, '/config');
}

/** POST /api/v1/play —— 触发一次演奏，见 api.md §6。 */
export function play(baseUrl: string, payload: PlayRequest): Promise<PlayData> {
  return request<PlayData>(baseUrl, '/play', { method: 'POST', body: payload });
}

/** POST /api/v1/play/stop —— 停止当前播放。 */
export function stopPlay(baseUrl: string): Promise<{ stopped: boolean }> {
  return request<{ stopped: boolean }>(baseUrl, '/play/stop', { method: 'POST' });
}
