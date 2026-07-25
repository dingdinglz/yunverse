// 同一份构建要先后跑在 PICO 模拟器(宿主机地址固定为 10.0.2.2)和真机头显(局域网 IP)上，
// 用 ?api= query 参数覆盖并记住，避免为两种目标各出一份构建。
const DEFAULT_BASE_URL = "http://10.0.2.2:8080";
const STORAGE_KEY = "airring.apiBaseUrl";

function resolveApiBaseUrl(): string {
  const fromQuery = new URLSearchParams(window.location.search).get("api");
  if (fromQuery) {
    localStorage.setItem(STORAGE_KEY, fromQuery);
    return fromQuery;
  }
  return (
    localStorage.getItem(STORAGE_KEY) ??
    import.meta.env.VITE_API_BASE_URL ??
    DEFAULT_BASE_URL
  );
}

export function apiUrl(path: string): string {
  return `${resolveApiBaseUrl()}/api/v1${path}`;
}
