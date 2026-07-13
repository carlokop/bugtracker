import { apiRequest } from "@/api/client";
import type {
  ConvertFeatureToBugInput,
  CreateBugInput,
  CreateFeatureInput,
  DeliverFeatureInput,
  FeedbackComment,
  FeedbackFilters,
  FeedbackItem,
  ItemStatus,
  ProjectFeedbackCounts,
} from "@/types";

function buildQuery(filters?: FeedbackFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.status) params.set("status", filters.status);
  if (filters.pageUrl) params.set("pageUrl", filters.pageUrl);
  if (filters.deviceType) params.set("deviceType", filters.deviceType);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function fetchFeedback(
  projectId: string,
  filters?: FeedbackFilters,
): Promise<{ items: FeedbackItem[] }> {
  return apiRequest(
    `/api/projects/${projectId}/feedback${buildQuery(filters)}`,
  );
}

export async function getFeedbackCounts(
  projectId: string,
): Promise<{ counts: ProjectFeedbackCounts }> {
  return apiRequest(`/api/projects/${projectId}/feedback/counts`);
}

export async function getFeedbackItem(
  id: string,
): Promise<{ item: FeedbackItem }> {
  return apiRequest(`/api/feedback/${id}`);
}

export async function createBug(
  projectId: string,
  input: Omit<CreateBugInput, "projectId">,
): Promise<{ item: FeedbackItem }> {
  return apiRequest(`/api/projects/${projectId}/feedback/bugs`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function createFeature(
  projectId: string,
  input: Omit<CreateFeatureInput, "projectId">,
): Promise<{ item: FeedbackItem }> {
  return apiRequest(`/api/projects/${projectId}/feedback/features`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateFeedbackStatus(
  id: string,
  status: ItemStatus,
): Promise<{ item: FeedbackItem }> {
  return apiRequest(`/api/feedback/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deliverFeature(
  id: string,
  input: DeliverFeatureInput,
): Promise<{ item: FeedbackItem }> {
  return apiRequest(`/api/feedback/${id}/deliver`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function convertFeatureToBug(
  id: string,
  input: ConvertFeatureToBugInput,
): Promise<{ item: FeedbackItem }> {
  return apiRequest(`/api/feedback/${id}/convert-to-bug`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deleteFeedback(id: string): Promise<void> {
  await apiRequest(`/api/feedback/${id}`, { method: "DELETE" });
}

export async function getComments(
  feedbackId: string,
): Promise<{ comments: FeedbackComment[] }> {
  return apiRequest(`/api/feedback/${feedbackId}/comments`);
}

export async function addComment(
  feedbackId: string,
  text: string,
): Promise<{ comment: FeedbackComment }> {
  return apiRequest(`/api/feedback/${feedbackId}/comments`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function getBugsForFeature(
  featureId: string,
): Promise<{ items: FeedbackItem[] }> {
  return apiRequest(`/api/feedback/${featureId}/linked-bugs`);
}

export async function uploadScreenshot(
  dataUrl: string,
): Promise<{ url: string }> {
  return apiRequest("/api/uploads/screenshot", {
    method: "POST",
    body: JSON.stringify({ dataUrl }),
  });
}
