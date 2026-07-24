// fetch 封装：base URL、超时、统一响应解包、错误规范化。
// 严格遵守 ../api.md §2：路径以 /api/v1 开头，统一响应结构 { success, data, error }。

import { ApiClientError, type ApiResponse } from "@/types/api";
import { REQUEST_TIMEOUT_MS } from "@/constants/enums";

/** base URL 来自环境变量（浏览器可见需 NEXT_PUBLIC_ 前缀），默认本机后端 */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const API_PREFIX = "/api/v1";

/** 供 SSE / EventSource 拼接完整地址用（EventSource 不走 fetch 封装） */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${API_PREFIX}${path}`;
}

interface RequestOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
  query?: Record<string, string | number | undefined>;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(apiUrl(path));
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/** 通用请求核心：处理超时、外部取消、响应解包与错误规范化。 */
async function request<T>(
  method: string,
  path: string,
  body: unknown | undefined,
  options: RequestOptions,
): Promise<T> {
  const { timeoutMs = REQUEST_TIMEOUT_MS, signal, query } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // 外部 signal（组件卸载）与内部超时任意触发都应中断请求
  const onExternalAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", onExternalAbort);
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  let payload: string | undefined;
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: payload,
      signal: controller.signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new ApiClientError("TIMEOUT", "请求超时或已取消");
    }
    throw new ApiClientError("NETWORK_ERROR", "无法连接后端服务");
  } finally {
    clearTimeout(timeoutId);
    if (signal) signal.removeEventListener("abort", onExternalAbort);
  }

  let respBody: ApiResponse<T>;
  try {
    respBody = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError("BAD_RESPONSE", "响应数据格式异常");
  }

  if (!res.ok || !respBody.success) {
    throw new ApiClientError(
      respBody.error?.code ?? `HTTP_${res.status}`,
      respBody.error?.message ?? `请求失败 (HTTP ${res.status})`,
      respBody.error?.details,
    );
  }

  if (respBody.data === undefined) {
    throw new ApiClientError("BAD_RESPONSE", "响应缺少 data 字段");
  }

  return respBody.data;
}

/** GET 请求并解包统一响应结构。失败一律抛 ApiClientError。 */
export async function apiGet<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  return request<T>("GET", path, undefined, options);
}

/** POST 请求（可带 JSON body）。 */
export async function apiPost<T>(
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  return request<T>("POST", path, body, options);
}

/** DELETE 请求。 */
export async function apiDelete<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  return request<T>("DELETE", path, undefined, options);
}
