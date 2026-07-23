import type { ApiError } from '@/types/api';

/**
 * 客户端错误类型。见 mobile-client.md §9。
 * kind 用于区分错误来源，message 为可直接展示给用户的中文文案。
 */
export type AppErrorKind = 'network' | 'timeout' | 'backend' | 'unknown';

export class AppError extends Error {
  kind: AppErrorKind;
  /** 后端返回的错误码（backend 类错误时存在），如 AUDIO_NOT_FOUND。 */
  code?: string;
  /** 原始错误 / 后端 error 对象，便于开发模式排查。 */
  original?: unknown;

  constructor(kind: AppErrorKind, message: string, code?: string, original?: unknown) {
    super(message);
    this.name = 'AppError';
    this.kind = kind;
    this.code = code;
    this.original = original;
  }
}

/** 后端错误码 → 中文文案，见 mobile-client.md §9 / api.md §10。 */
const BACKEND_MESSAGES: Record<string, string> = {
  AUDIO_NOT_FOUND: '当前乐器、音调或技法的音频资源未配置',
  PLAYBACK_DEVICE_UNAVAILABLE: '播放设备不可用，请检查音频输出设备',
  PLAYBACK_FAILED: '播放任务提交失败，请查看后端日志',
  INVALID_PARAMETER: '请求参数不合法，请检查乐器、音调或音符',
  SERVICE_UNAVAILABLE: '服务暂时不可用，请稍后重试',
  INTERNAL_ERROR: '后端内部错误，请查看后端日志',
  UNAUTHORIZED: '设备令牌无效或缺失',
};

/** 网络不可达。 */
export function networkError(original?: unknown): AppError {
  logError('network', original);
  return new AppError('network', '无法连接后端，请检查后端地址和网络', undefined, original);
}

/** 请求超时。 */
export function timeoutError(original?: unknown): AppError {
  logError('timeout', original);
  return new AppError('timeout', '请求超时，请检查后端服务', undefined, original);
}

/** 后端返回的业务错误。 */
export function backendError(error: ApiError): AppError {
  const message = BACKEND_MESSAGES[error.code] ?? error.message ?? '后端返回错误';
  logError('backend', error);
  return new AppError('backend', message, error.code, error);
}

/** 未知错误。 */
export function unknownError(original?: unknown): AppError {
  logError('unknown', original);
  return new AppError('unknown', '发生未知错误，请稍后重试', undefined, original);
}

/** 开发模式下输出完整错误，便于排查（mobile-client.md §9）。 */
function logError(kind: AppErrorKind, original: unknown) {
  if (__DEV__) {
    console.warn(`[AppError:${kind}]`, original);
  }
}
