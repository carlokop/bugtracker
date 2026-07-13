import { apiRequest } from "@/api/client";
import type { User } from "@/types";

export async function login(
  email: string,
  password: string,
): Promise<{ user: User }> {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logout(): Promise<void> {
  await apiRequest("/api/auth/logout", { method: "POST" });
}

export async function getMe(): Promise<{ user: User }> {
  return apiRequest("/api/auth/me");
}

export async function getUsers(): Promise<{ users: User[] }> {
  return apiRequest("/api/auth/users");
}
