import { create } from "zustand";
import * as authApi from "@/api/auth";
import { ApiError } from "@/api/client";
import { useProjectContextStore } from "@/store/useProjectContextStore";
import type { User } from "@/types";

interface AuthState {
  currentUser: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  loginError: string | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  getUsers: () => Promise<User[]>;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isLoading: false,
  isInitialized: false,
  loginError: null,

  initialize: async () => {
    set({ isLoading: true });
    try {
      const { user } = await authApi.getMe();
      set({ currentUser: user, isLoading: false, isInitialized: true });
    } catch {
      set({ currentUser: null, isLoading: false, isInitialized: true });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, loginError: null });
    try {
      const { user } = await authApi.login(email, password);
      set({ currentUser: user, isLoading: false, loginError: null });
      return true;
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Ongeldig e-mailadres of wachtwoord";
      set({
        isLoading: false,
        loginError: message,
      });
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authApi.logout();
    } finally {
      useProjectContextStore.getState().clearProject();
      set({ currentUser: null, isLoading: false, loginError: null });
    }
  },

  getUsers: async () => {
    const { users } = await authApi.getUsers();
    return users;
  },
}));
