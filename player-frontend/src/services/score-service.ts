import { request } from '@/services/api-client';

/**
 * 曲谱相关 API，对接后端 /api/v1/scores 路由。
 */

export interface ScoreSummary {
  id: string;
  title: string;
  key: string;
  instrument: string;
  tempo: number | null;
  timeSignature: string | null;
  noteCount: number;
}

export interface ScoreActiveState {
  active: boolean;
  scoreId: string | null;
  title?: string;
  instrument?: string;
  key?: string;
  tempo?: number;
  currentIndex: number;
  totalNotes: number;
}

/** GET /api/v1/scores —— 获取曲谱列表 */
export function getScores(baseUrl: string): Promise<{ scores: ScoreSummary[] }> {
  return request<{ scores: ScoreSummary[] }>(baseUrl, '/scores');
}

/** POST /api/v1/scores/{id}/start —— 开始曲谱模式 */
export function startScore(baseUrl: string, scoreId: string): Promise<ScoreActiveState> {
  return request<ScoreActiveState>(baseUrl, `/scores/${scoreId}/start`, { method: 'POST' });
}

/** POST /api/v1/scores/stop —— 停止曲谱模式 */
export function stopScore(baseUrl: string): Promise<ScoreActiveState> {
  return request<ScoreActiveState>(baseUrl, '/scores/stop', { method: 'POST' });
}

/** POST /api/v1/scores/advance —— 手动推进下一音符 */
export function advanceScore(baseUrl: string): Promise<ScoreActiveState> {
  return request<ScoreActiveState>(baseUrl, '/scores/advance', { method: 'POST' });
}

/** GET /api/v1/scores/active —— 获取当前曲谱状态 */
export function getActiveScore(baseUrl: string): Promise<ScoreActiveState> {
  return request<ScoreActiveState>(baseUrl, '/scores/active');
}
