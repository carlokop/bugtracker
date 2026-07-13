import { apiRequest } from "@/api/client";

export async function capturePageScreenshot(input: {
  url: string;
  projectId: string;
  width: number;
}): Promise<{ url: string }> {
  return apiRequest("/api/screenshots/capture", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
