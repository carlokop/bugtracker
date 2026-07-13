export type UserRole = "admin" | "client";

export type BugStatus = "open" | "in_progress" | "in_review" | "done";

export type FeatureStatus =
  | "requested"
  | "approved"
  | "in_progress"
  | "delivered"
  | "accepted";

/** @deprecated Use BugStatus or FeatureStatus per item.type */
export type FeedbackStatus = BugStatus;

export type ItemStatus = BugStatus | FeatureStatus;

export type DeviceType = "desktop" | "tablet" | "mobile";

export type FeedbackType = "bug" | "feature";

export type NotificationType =
  | "new_feedback"
  | "new_bug"
  | "new_feature"
  | "new_comment"
  | "status_change"
  | "mention";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordSet?: boolean;
  /** Mock only — in productie wordt een hash opgeslagen */
  password?: string;
}

export interface CreateClientUserInput {
  email: string;
  name?: string;
}

export interface UpdateClientUserInput {
  email?: string;
  name?: string;
}

export interface Project {
  id: string;
  name: string;
  targetUrl: string;
  description: string;
  adminId: string;
  proxyAuthUser?: string | null;
  hasProxyAuth?: boolean;
  createdAt: string;
}

export interface UpdateProjectInput {
  name?: string;
  targetUrl?: string;
  description?: string;
  proxyAuthUser?: string | null;
  proxyAuthPassword?: string | null;
}

export interface ProjectMember {
  projectId: string;
  userId: string;
}

export interface FeedbackItem {
  id: string;
  projectId: string;
  type: FeedbackType;
  status: ItemStatus;
  problemDescription: string;
  definitionOfDone: string;
  deviceType: DeviceType;
  hasLocation: boolean;
  pageUrl: string | null;
  cssSelector: string | null;
  x: number | null;
  y: number | null;
  screenshotUrl: string | null;
  deliveryDescription?: string | null;
  linkedFeatureId?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackComment {
  id: string;
  feedbackItemId: string;
  userId: string;
  userName?: string;
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

export interface CreateBugInput {
  projectId: string;
  pageUrl: string;
  cssSelector: string;
  x: number;
  y: number;
  screenshotUrl: string;
  problemDescription: string;
  definitionOfDone: string;
  deviceType: DeviceType;
  linkedFeatureId?: string;
}

export interface CreateFeatureInput {
  projectId: string;
  problemDescription: string;
  definitionOfDone: string;
  deviceType: DeviceType;
  pageUrl?: string;
  cssSelector?: string;
  x?: number;
  y?: number;
  screenshotUrl?: string;
}

export interface DeliverFeatureInput {
  pageUrl: string;
  cssSelector: string;
  x: number;
  y: number;
  screenshotUrl: string;
  deliveryDescription: string;
  deviceType: DeviceType;
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
  status?: ItemStatus;
  pageUrl?: string;
  deviceType?: DeviceType;
  type?: FeedbackType;
}

export const BUG_STATUS_LABELS: Record<BugStatus, string> = {
  open: "Open",
  in_progress: "In behandeling",
  in_review: "Ter goedkeuring",
  done: "Gedaan",
};

export const FEATURE_STATUS_LABELS: Record<FeatureStatus, string> = {
  requested: "Aangevraagd",
  approved: "Goedgekeurd",
  in_progress: "In ontwikkeling",
  delivered: "Opgeleverd",
  accepted: "Geaccepteerd",
};

/** @deprecated Use BUG_STATUS_LABELS */
export const FEEDBACK_STATUS_LABELS: Record<BugStatus, string> =
  BUG_STATUS_LABELS;

export const BOARD_STATUSES: BugStatus[] = [
  "open",
  "in_progress",
  "in_review",
  "done",
];

export const FEATURE_BOARD_STATUSES: FeatureStatus[] = [
  "requested",
  "approved",
  "in_progress",
  "delivered",
  "accepted",
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

export function getStatusLabel(
  status: ItemStatus,
  type: FeedbackType,
): string {
  if (type === "bug") {
    return BUG_STATUS_LABELS[status as BugStatus];
  }
  return FEATURE_STATUS_LABELS[status as FeatureStatus];
}

export function isBugItem(item: FeedbackItem): boolean {
  return item.type === "bug";
}

export function isFeatureItem(item: FeedbackItem): boolean {
  return item.type === "feature";
}

export interface ProjectFeedbackCounts {
  bugs: Record<BugStatus, number>;
  features: Record<FeatureStatus, number>;
}
