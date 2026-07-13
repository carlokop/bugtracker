import { create } from "zustand";
import {
  MOCK_PROJECTS,
  MOCK_PROJECT_MEMBERS,
  MOCK_USERS,
} from "@/mock/seed";
import { delay } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import type { CreateProjectInput, Project, User } from "@/types";

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
    return user;
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
