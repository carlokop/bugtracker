import { create } from "zustand";
import * as projectsApi from "@/api/projects";
import { ApiError } from "@/api/client";
import { useAuthStore } from "@/store/useAuthStore";
import type {
  CreateClientUserInput,
  CreateProjectInput,
  Project,
  UpdateClientUserInput,
  UpdateProjectInput,
  User,
} from "@/types";

function assertAdmin() {
  const user = useAuthStore.getState().currentUser;
  if (!user || user.role !== "admin") {
    throw new Error("Alleen admins mogen klanten beheren");
  }
}

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  fetchProjects: () => Promise<Project[]>;
  getProject: (id: string) => Promise<Project | undefined>;
  getProjectsForUser: (userId: string, role: string) => Promise<Project[]>;
  createProject: (input: CreateProjectInput, adminId: string) => Promise<Project>;
  updateProject: (id: string, input: UpdateProjectInput) => Promise<Project>;
  createClientUser: (
    projectId: string,
    input: CreateClientUserInput,
  ) => Promise<User>;
  updateClientUser: (
    projectId: string,
    userId: string,
    input: UpdateClientUserInput,
  ) => Promise<User>;
  removeClient: (projectId: string, userId: string) => Promise<void>;
  sendClientPasswordReset: (
    projectId: string,
    userId: string,
  ) => Promise<string>;
  getProjectMembers: (projectId: string) => Promise<User[]>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  isLoading: false,

  fetchProjects: async () => {
    set({ isLoading: true });
    try {
      const { projects } = await projectsApi.fetchProjects();
      set({ projects, isLoading: false });
      return projects;
    } catch {
      set({ isLoading: false });
      return get().projects;
    }
  },

  getProject: async (id: string) => {
    try {
      const { project } = await projectsApi.getProject(id);
      return project;
    } catch {
      return get().projects.find((p) => p.id === id);
    }
  },

  getProjectsForUser: async (_userId: string, _role: string) => {
    set({ isLoading: true });
    try {
      const { projects } = await projectsApi.fetchProjects();
      set({ projects, isLoading: false });
      return projects;
    } catch {
      set({ isLoading: false });
      return [];
    }
  },

  createProject: async (input: CreateProjectInput, _adminId: string) => {
    try {
      const { project } = await projectsApi.createProject(input);
      set((state) => ({ projects: [...state.projects, project] }));
      return project;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw error;
    }
  },

  updateProject: async (id: string, input: UpdateProjectInput) => {
    try {
      const { project } = await projectsApi.updateProject(id, input);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? project : p)),
      }));
      return project;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw error;
    }
  },

  createClientUser: async (projectId: string, input: CreateClientUserInput) => {
    assertAdmin();
    try {
      const { user } = await projectsApi.createClientUser(projectId, input);
      return user;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw error;
    }
  },

  updateClientUser: async (
    projectId: string,
    userId: string,
    input: UpdateClientUserInput,
  ) => {
    assertAdmin();
    try {
      const { user } = await projectsApi.updateClientUser(
        projectId,
        userId,
        input,
      );
      return user;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw error;
    }
  },

  removeClient: async (projectId: string, userId: string) => {
    assertAdmin();
    await projectsApi.removeClientUser(projectId, userId);
  },

  sendClientPasswordReset: async (projectId: string, userId: string) => {
    assertAdmin();
    try {
      const { message } = await projectsApi.sendClientPasswordReset(
        projectId,
        userId,
      );
      return message;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw error;
    }
  },

  getProjectMembers: async (projectId: string) => {
    const { members } = await projectsApi.getProjectMembers(projectId);
    return members;
  },
}));
