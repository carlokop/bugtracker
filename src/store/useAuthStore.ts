import { create } from "zustand";
import { MOCK_USERS } from "@/mock/seed";
import { delay } from "@/lib/utils";
import type { User } from "@/types";

interface AuthState {
  currentUser: User | null;
  isLoading: boolean;
  login: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  getUsers: () => Promise<User[]>;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isLoading: false,

  login: async (userId: string) => {
    set({ isLoading: true });
    await delay();
    const user = MOCK_USERS.find((u) => u.id === userId) ?? null;
    set({ currentUser: user, isLoading: false });
  },

  logout: async () => {
    set({ isLoading: true });
    await delay(50);
    set({ currentUser: null, isLoading: false });
  },

  getUsers: async () => {
    await delay(50);
    return MOCK_USERS;
  },
}));
