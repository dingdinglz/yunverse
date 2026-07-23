// 统一响应包与错误类型（严格对齐 ../api.md §2.3）

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  requestId?: string;
}

/**
 * 前端内部使用的规范化错误。所有服务层抛出的异常都归一到此类型，
 * 便于 UI 层统一展示（后端不可用 / 请求失败 / 数据格式异常）。
 */
export class ApiClientError extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.details = details;
  }
}
