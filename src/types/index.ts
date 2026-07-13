export type UserRole = "admin" | "client";

export type FeedbackStatus =
  | "open"
  | "in_progress"
  | "in_review"
  | "done";

export type DeviceType = "desktop" | "tablet" | "mobile";

export type FeedbackType = "bug" | "feature";

export type NotificationType =
  | "new_feedback"
  | "new_comment"
  | "status_change"
  | "mention";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Project {
  id: string;
  name: string;
  targetUrl: string;
  description: string;
  adminId: string;
  createdAt: string;
}

export interface ProjectMember {
  projectId: string;
  userId: string;
}

export interface FeedbackItem {
  id: string;
  projectId: string;
  pageUrl: string;
  cssSelector: string;
  x: number;
  y: number;
  screenshotUrl: string;
  problemDescription: string;
  definitionOfDone: string;
  type: FeedbackType;
  status: FeedbackStatus;
  deviceType: DeviceType;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackComment {
  id: string;
  feedbackItemId: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  referenceId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface CreateProjectInput {
  name: string;
  targetUrl: string;
  description: string;
}

export interface CreateFeedbackInput {
  projectId: string;
  pageUrl: string;
  cssSelector: string;
  x: number;
  y: number;
  screenshotUrl: string;
  problemDescription: string;
  definitionOfDone: string;
  deviceType: DeviceType;
  type: FeedbackType;
}

export interface ConvertFeatureToBugInput {
  pageUrl: string;
  cssSelector: string;
  x: number;
  y: number;
  screenshotUrl: string;
  problemDescription: string;
  definitionOfDone: string;
  deviceType: DeviceType;
}

export interface FeedbackFilters {
  status?: FeedbackStatus;
  pageUrl?: string;
  deviceType?: DeviceType;
}

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  open: "Open",
  in_progress: "In behandeling",
  in_review: "Ter goedkeuring",
  done: "Gedaan",
};

export const BOARD_STATUSES: FeedbackStatus[] = [
  "open",
  "in_progress",
  "in_review",
  "done",
];

export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  desktop: "Desktop",
  tablet: "Tablet",
  mobile: "Mobiel",
};

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  bug: "Bug",
  feature: "Feature",
};
