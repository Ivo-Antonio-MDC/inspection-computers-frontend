"use client";

import { create } from "zustand";
import { apiErrorMessage, onTokenChange, refreshAccessToken, setAccessToken } from "@/lib/api";
import { AuthService } from "@/lib/services";
import type { AuthUser } from "@/types";

function decodePayload(token: string) {
  const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function decodeUser(token: string): AuthUser | null {
  try {
    const payload = decodePayload(token);
    return {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      mustChangePassword: !!payload.mustChangePassword,
    };
  } catch {
    return null;
  }
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  /** true até à primeira tentativa de restaurar a sessão terminar */
  isInitializing: boolean;
  loading: boolean;
  error: string | null;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<AuthUser | null>;
  changePassword: (current: string, next: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

let proactiveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleRefresh(token: string | null) {
  if (proactiveTimer) clearTimeout(proactiveTimer);
  proactiveTimer = null;
  if (!token) return;
  try {
    const { exp } = decodePayload(token);
    const delay = exp * 1000 - Date.now() - 60_000;
    if (delay > 0) proactiveTimer = setTimeout(() => void refreshAccessToken(), delay);
  } catch {
    /* token malformado */
  }
}

let initPromise: Promise<void> | null = null;

const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  token: null,
  isInitializing: true,
  loading: false,
  error: null,

  init: () => {
    if (!initPromise) {
      initPromise = refreshAccessToken().then(() => set({ isInitializing: false }));
    }
    return initPromise;
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { accessToken, user } = await AuthService.login(email, password);
      setAccessToken(accessToken);
      set({ loading: false, user, isInitializing: false });
      return user;
    } catch (e) {
      set({ loading: false, error: apiErrorMessage(e, "Não foi possível iniciar sessão") });
      return null;
    }
  },

  changePassword: async (current, next) => {
    set({ loading: true, error: null });
    try {
      const { accessToken } = await AuthService.changePassword(current, next);
      setAccessToken(accessToken);
      set({ loading: false });
      return true;
    } catch (e) {
      set({ loading: false, error: apiErrorMessage(e) });
      return false;
    }
  },

  logout: async () => {
    try {
      await AuthService.logout();
    } catch {
      /* ignora */
    }
    initPromise = null;
    setAccessToken(null);
    set({ user: null, token: null, isInitializing: false });
  },

  clearError: () => set({ error: null }),
}));

// Mantém o store sincronizado com renovações feitas pelo interceptor do axios.
onTokenChange((token) => {
  scheduleRefresh(token);
  useAuthStore.setState({ token, user: token ? decodeUser(token) : null });
});

export default useAuthStore;
