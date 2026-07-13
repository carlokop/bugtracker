import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProjectContextState {
  selectedProjectId: string | null;
  selectProject: (projectId: string) => void;
  clearProject: () => void;
}

export const useProjectContextStore = create<ProjectContextState>()(
  persist(
    (set) => ({
      selectedProjectId: null,
      selectProject: (projectId: string) =>
        set({ selectedProjectId: projectId }),
      clearProject: () => set({ selectedProjectId: null }),
    }),
    { name: "bugtracker-project-context" },
  ),
);
