import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";

// Access token apenas em memória (nunca em localStorage). O refresh token vive
// num cookie HttpOnly e o csrf_token num cookie legível — padrão da app Biscate258.
let accessToken: string | null = null;
const listeners = new Set<(token: string | null) => void>();

export const getAccessToken = () => accessToken;
export function setAccessToken(token: string | null) {
  accessToken = token;
  listeners.forEach((l) => l(token));
}
export function onTokenChange(listener: (token: string | null) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function csrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((row) => row.startsWith("csrf_token="));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

const BASE_URL = "/api/v1";

/** Instância sem interceptors para /auth/refresh — evita ciclos. */
export const bareApi = axios.create({ baseURL: BASE_URL, withCredentials: true, timeout: 15000 });
bareApi.interceptors.request.use((config) => {
  const csrf = csrfToken();
  if (csrf) config.headers["X-CSRF-Token"] = csrf;
  return config;
});

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return Promise.reject(Object.assign(new Error("Sem ligação à internet."), { isOffline: true }));
  }
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

/** Renova o access token uma única vez mesmo com vários pedidos em paralelo. */
export function refreshAccessToken(): Promise<string | null> {
  // Sem cookie CSRF não há sessão para renovar — evita um pedido que falharia com 403.
  if (!csrfToken()) {
    setAccessToken(null);
    return Promise.resolve(null);
  }
  if (!refreshing) {
    refreshing = bareApi
      .post("/auth/refresh")
      .then((res) => {
        const token = res.data?.data?.accessToken ?? null;
        setAccessToken(token);
        return token;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

api.interceptors.response.use(
  (res) => {
    // Desembrulha o envelope { success, data } do TransformInterceptor
    if (res.data && typeof res.data === "object" && "success" in res.data && "data" in res.data) {
      return { ...res, data: res.data.data };
    }
    return res;
  },
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isAuthCall = original?.url?.startsWith("/auth/login") || original?.url?.startsWith("/auth/refresh");

    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      const token = await refreshAccessToken();
      if (token) {
        original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
        return api(original);
      }
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/signin")) {
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.replace(`/signin?expired=1&next=${next}`);
      }
    }
    return Promise.reject(error);
  },
);

export default api;

export interface ApiErrorBody {
  message?: string | string[];
  error?: string;
  details?: unknown;
  statusCode?: number;
}

export function apiErrorMessage(err: unknown, fallback = "Ocorreu um erro inesperado"): string {
  if ((err as { isOffline?: boolean })?.isOffline) return "Sem ligação à internet. Verifique a sua conexão.";
  if (axios.isAxiosError(err)) {
    if (err.code === "ECONNABORTED") return "O servidor demorou demasiado a responder.";
    if (!err.response) return "Não foi possível contactar o servidor.";
    const body = err.response.data as ApiErrorBody | undefined;
    const msg = body?.message;
    if (Array.isArray(msg)) return msg.join(" · ");
    if (typeof msg === "string") return msg;
    if (err.response.status === 403) return "Não tem permissão para esta operação.";
  }
  return fallback;
}

export function apiErrorDetails<T>(err: unknown): T | undefined {
  if (axios.isAxiosError(err)) return (err.response?.data as ApiErrorBody | undefined)?.details as T | undefined;
  return undefined;
}

/** Descarrega um ficheiro autenticado (Excel/CSV). */
export async function downloadFile(path: string, params: Record<string, unknown>, fallbackName: string) {
  const res = await api.get<Blob>(path, { params, responseType: "blob", timeout: 120000 });
  const disposition = res.headers["content-disposition"] as string | undefined;
  const name = /filename="?([^";]+)"?/.exec(disposition ?? "")?.[1] ?? fallbackName;
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Remove chaves vazias antes de enviar filtros como query string. */
export function cleanParams<T extends Record<string, unknown>>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null),
  ) as Partial<T>;
}
