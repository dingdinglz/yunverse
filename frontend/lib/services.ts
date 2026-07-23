// 各后端接口的服务函数。仅封装电脑网站前端需要的读取接口
// （health / config / state / history）；play 与 ring/gesture 属手机端/硬件端，不在此调用。

import { apiGet } from "@/lib/apiClient";
import { HISTORY_LIMIT } from "@/constants/enums";
import type {
  AppConfig,
  CurrentState,
  Health,
  HistoryPage,
} from "@/types/domain";

export function getHealth(signal?: AbortSignal): Promise<Health> {
  return apiGet<Health>("/health", { signal });
}

export function getConfig(signal?: AbortSignal): Promise<AppConfig> {
  return apiGet<AppConfig>("/config", { signal });
}

export function getState(signal?: AbortSignal): Promise<CurrentState> {
  return apiGet<CurrentState>("/state", { signal });
}

export function getHistory(
  limit: number = HISTORY_LIMIT,
  signal?: AbortSignal,
): Promise<HistoryPage> {
  return apiGet<HistoryPage>("/history", { query: { limit }, signal });
}
