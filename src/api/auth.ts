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

export async function forgotPassword(
  email: string,
): Promise<{ message: string }> {
  return apiRequest("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<{ ok: boolean }> {
  return apiRequest("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}
