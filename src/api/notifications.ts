import { apiRequest } from "@/api/client";
import type { Notification } from "@/types";

export async function fetchNotifications(): Promise<{
  notifications: Notification[];
}> {
  return apiRequest("/api/notifications");
}

export async function markNotificationRead(
  id: string,
): Promise<{ notification: Notification }> {
  return apiRequest(`/api/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiRequest("/api/notifications/read-all", { method: "POST" });
}
