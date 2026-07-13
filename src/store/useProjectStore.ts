import { create } from "zustand";
import {
  MOCK_PROJECTS,
  MOCK_PROJECT_MEMBERS,
  MOCK_USERS,
} from "@/mock/seed";
import { delay } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import type { CreateClientUserInput, CreateProjectInput, Project, UpdateClientUserInput, User } from "@/types";

function assertAdmin() {
  const user = useAuthStore.getState().currentUser;
  if (!user || user.role !== "admin") {
    throw new Error("Alleen admins mogen klanten beheren");
  }
}

interface ProjectState {
  projects: Project[];
  members: { projectId: string; userId: string }[];
  isLoading: boolean;
  fetchProjects: () => Promise<Project[]>;
  getProject: (id: string) => Promise<Project | undefined>;
  getProjectsForUser: (userId: string, role: string) => Promise<Project[]>;
  createProject: (input: CreateProjectInput, adminId: string) => Promise<Project>;
  inviteClient: (projectId: string, email: string) => Promise<User>;
  createClientUser: (
    projectId: string,
    input: CreateClientUserInput,
  ) => Promise<User>;
  updateClientUser: (
    userId: string,
    input: UpdateClientUserInput,
  ) => Promise<User>;
  removeClient: (projectId: string, userId: string) => Promise<void>;
  getProjectMembers: (projectId: string) => Promise<User[]>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [...MOCK_PROJECTS],
  members: [...MOCK_PROJECT_MEMBERS],
  isLoading: false,

  fetchProjects: async () => {
    set({ isLoading: true });
    await delay();
    set({ isLoading: false });
    return get().projects;
  },

  getProject: async (id: string) => {
    await delay(50);
    return get().projects.find((p) => p.id === id);
  },

  getProjectsForUser: async (userId: string, role: string) => {
    await delay();
    if (role === "admin") {
      return get().projects.filter((p) => p.adminId === userId);
    }
    const memberProjectIds = get()
      .members.filter((m) => m.userId === userId)
      .map((m) => m.projectId);
    return get().projects.filter((p) => memberProjectIds.includes(p.id));
  },

  createProject: async (input: CreateProjectInput, adminId: string) => {
    await delay();
    const project: Project = {
      id: `proj-${Date.now()}`,
      ...input,
      adminId,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ projects: [...state.projects, project] }));
    return project;
  },

  inviteClient: async (projectId: string, email: string) => {
    assertAdmin();
    await delay();
    let user = MOCK_USERS.find((u) => u.email === email && u.role === "client");
    if (!user) {
      user = {
        id: `user-client-${Date.now()}`,
        email,
        name: email.split("@")[0],
        role: "client",
        password: "welkom123",
      };
      MOCK_USERS.push(user);
    }
    const exists = get().members.some(
      (m) => m.projectId === projectId && m.userId === user!.id,
    );
    if (!exists) {
      set((state) => ({
        members: [...state.members, { projectId, userId: user!.id }],
      }));
    }
    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  createClientUser: async (projectId: string, input: CreateClientUserInput) => {
    assertAdmin();
    await delay();
    const existing = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === input.email.toLowerCase(),
    );
    if (existing) {
      throw new Error("Er bestaat al een account met dit e-mailadres");
    }
    const user: User = {
      id: `user-client-${Date.now()}`,
      email: input.email,
      name: input.name ?? input.email.split("@")[0],
      role: "client",
      password: input.password,
    };
    MOCK_USERS.push(user);
    set((state) => ({
      members: [...state.members, { projectId, userId: user.id }],
    }));
    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  updateClientUser: async (userId: string, input: UpdateClientUserInput) => {
    assertAdmin();
    await delay();
    const index = MOCK_USERS.findIndex((u) => u.id === userId);
    if (index === -1) {
      throw new Error("Gebruiker niet gevonden");
    }
    const user = MOCK_USERS[index];
    if (user.role !== "client") {
      throw new Error("Alleen klantaccounts kunnen worden bewerkt");
    }
    if (input.email) {
      const emailTaken = MOCK_USERS.some(
        (u) =>
          u.id !== userId &&
          u.email.toLowerCase() === input.email!.toLowerCase(),
      );
      if (emailTaken) {
        throw new Error("Dit e-mailadres is al in gebruik");
      }
      user.email = input.email;
    }
    if (input.name) user.name = input.name;
    if (input.password) user.password = input.password;
    MOCK_USERS[index] = user;
    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  removeClient: async (projectId: string, userId: string) => {
    assertAdmin();
    await delay(50);
    set((state) => ({
      members: state.members.filter(
        (m) => !(m.projectId === projectId && m.userId === userId),
      ),
    }));
  },

  getProjectMembers: async (projectId: string) => {
    await delay(50);
    const memberIds = get()
      .members.filter((m) => m.projectId === projectId)
      .map((m) => m.userId);
    return MOCK_USERS.filter((u) => memberIds.includes(u.id));
  },
}));
