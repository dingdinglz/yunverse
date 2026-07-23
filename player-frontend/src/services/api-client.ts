import { API_PREFIX, REQUEST_TIMEOUT_MS } from '@/config/app-config';
import { backendError, networkError, timeoutError, unknownError } from '@/services/errors';
import type { ApiResponse } from '@/types/api';

interface RequestOptions {
  method?: 'GET' | 'POST';
  /** 请求体，会被 JSON 序列化。 */
  body?: unknown;
  /** 覆盖默认超时。 */
  timeoutMs?: number;
  /** 覆盖默认 signal（一般不需要）。 */
  signal?: AbortSignal;
}

/** 去掉尾部斜杠，避免拼接出双斜杠。 */
function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

/**
 * 统一 HTTP 请求封装，见 mobile-client.md §6.6 / api.md §2。
 * - 自动拼接 baseUrl + /api/v1 + path
 * - JSON 序列化 / 反序列化
 * - AbortController 超时控制
 * - 将网络错误 / 超时 / 后端 error 归一化为 AppError
 *
 * @param baseUrl 后端根地址（不含 /api/v1），如 http://localhost:8080
 * @param path 接口路径，如 /health、/play
 */
export async function request<T>(
  baseUrl: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, timeoutMs = REQUEST_TIMEOUT_MS } = options;
  const url = `${normalizeBaseUrl(baseUrl)}${API_PREFIX}${path}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: options.signal ?? controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw timeoutError(err);
    }
    // fetch 抛出通常意味着网络不可达 / DNS / 连接被拒。
    throw networkError(err);
  }
  clearTimeout(timer);

  let json: ApiResponse<T> | undefined;
  try {
    json = (await response.json()) as ApiResponse<T>;
  } catch (err) {
    // 响应无法解析为 JSON。
    throw unknownError(err);
  }

  if (json && json.success && json.data !== undefined) {
    return json.data;
  }

  // 统一失败响应（含 error 对象），见 api.md §2.3。
  if (json && json.error) {
    throw backendError(json.error);
  }

  // 非 2xx 且无标准 error 结构。
  if (!response.ok) {
    throw backendError({
      code: 'HTTP_' + response.status,
      message: `请求失败（HTTP ${response.status}）`,
    });
  }

  throw unknownError(json);
}
