import { apiRequest } from "@/api/client";
import type {
  CreateClientUserInput,
  CreateProjectInput,
  Project,
  UpdateClientUserInput,
  UpdateProjectInput,
  User,
} from "@/types";

export async function fetchProjects(): Promise<{ projects: Project[] }> {
  return apiRequest("/api/projects");
}

export async function getProject(id: string): Promise<{ project: Project }> {
  return apiRequest(`/api/projects/${id}`);
}

export async function createProject(
  input: CreateProjectInput,
): Promise<{ project: Project }> {
  return apiRequest("/api/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateProject(
  id: string,
  input: UpdateProjectInput,
): Promise<{ project: Project }> {
  return apiRequest(`/api/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function getProjectMembers(
  projectId: string,
): Promise<{ members: User[] }> {
  return apiRequest(`/api/projects/${projectId}/members`);
}

export async function createClientUser(
  projectId: string,
  input: CreateClientUserInput,
): Promise<{ user: User }> {
  return apiRequest(`/api/projects/${projectId}/members`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateClientUser(
  projectId: string,
  userId: string,
  input: UpdateClientUserInput,
): Promise<{ user: User }> {
  return apiRequest(`/api/projects/${projectId}/members/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function removeClientUser(
  projectId: string,
  userId: string,
): Promise<void> {
  await apiRequest(`/api/projects/${projectId}/members/${userId}`, {
    method: "DELETE",
  });
}

export async function sendClientPasswordReset(
  projectId: string,
  userId: string,
): Promise<{ ok: boolean; message: string }> {
  return apiRequest(
    `/api/projects/${projectId}/members/${userId}/send-password-reset`,
    { method: "POST" },
  );
}
