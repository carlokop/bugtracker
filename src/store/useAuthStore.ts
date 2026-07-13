import { create } from "zustand";
import { MOCK_USERS } from "@/mock/seed";
import { delay } from "@/lib/utils";
import { useProjectContextStore } from "@/store/useProjectContextStore";
import type { User } from "@/types";

interface AuthState {
  currentUser: User | null;
  isLoading: boolean;
  loginError: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginAsUser: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  getUsers: () => Promise<User[]>;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isLoading: false,
  loginError: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, loginError: null });
    await delay();
    const user = MOCK_USERS.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );
    if (!user) {
      set({
        isLoading: false,
        loginError: "Ongeldig e-mailadres of wachtwoord",
      });
      return false;
    }
    const { password: _, ...safeUser } = user;
    set({ currentUser: safeUser, isLoading: false, loginError: null });
    return true;
  },

  loginAsUser: async (userId: string) => {
    set({ isLoading: true, loginError: null });
    await delay(50);
    const user = MOCK_USERS.find((u) => u.id === userId);
    if (user) {
      const { password: _, ...safeUser } = user;
      useProjectContextStore.getState().clearProject();
      set({ currentUser: safeUser, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    await delay(50);
    useProjectContextStore.getState().clearProject();
    set({ currentUser: null, isLoading: false, loginError: null });
  },

  getUsers: async () => {
    await delay(50);
    return MOCK_USERS.map(({ password: _, ...user }) => user);
  },
}));
