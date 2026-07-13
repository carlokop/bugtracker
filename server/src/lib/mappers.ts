import type {
  DeviceType,
  FeedbackComment,
  FeedbackItem,
  FeedbackType,
  Notification,
  NotificationType,
  Project,
  User,
  UserRole,
} from "@prisma/client";

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "client";
  passwordSet: boolean;
}

export interface ApiProject {
  id: string;
  name: string;
  targetUrl: string;
  description: string;
  adminId: string;
  proxyAuthUser?: string | null;
  hasProxyAuth: boolean;
  createdAt: string;
}

export interface ApiFeedbackItem {
  id: string;
  projectId: string;
  type: "bug" | "feature";
  status: string;
  problemDescription: string;
  definitionOfDone: string;
  deviceType: "desktop" | "tablet" | "mobile";
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

export interface ApiFeedbackComment {
  id: string;
  feedbackItemId: string;
  userId: string;
  userName?: string;
  text: string;
  createdAt: string;
}

export interface ApiNotification {
  id: string;
  userId: string;
  type:
    | "new_feedback"
    | "new_bug"
    | "new_feature"
    | "new_comment"
    | "status_change"
    | "mention";
  referenceId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

function mapRole(role: UserRole): "admin" | "client" {
  return role === "ADMIN" ? "admin" : "client";
}

function mapFeedbackType(type: FeedbackType): "bug" | "feature" {
  return type === "BUG" ? "bug" : "feature";
}

function mapDeviceType(deviceType: DeviceType): "desktop" | "tablet" | "mobile" {
  return deviceType.toLowerCase() as "desktop" | "tablet" | "mobile";
}

function mapNotificationType(
  type: NotificationType,
): ApiNotification["type"] {
  const map: Record<NotificationType, ApiNotification["type"]> = {
    NEW_FEEDBACK: "new_feedback",
    NEW_BUG: "new_bug",
    NEW_FEATURE: "new_feature",
    NEW_COMMENT: "new_comment",
    STATUS_CHANGE: "status_change",
    MENTION: "mention",
  };
  return map[type];
}

export function toApiUser(user: User): ApiUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: mapRole(user.role),
    passwordSet: Boolean(user.passwordHash),
  };
}

export function toApiProject(project: Project): ApiProject {
  return {
    id: project.id,
    name: project.name,
    targetUrl: project.targetUrl,
    description: project.description,
    adminId: project.adminId,
    proxyAuthUser: project.proxyAuthUser,
    hasProxyAuth: Boolean(project.proxyAuthPassword),
    createdAt: project.createdAt.toISOString(),
  };
}

export function toApiFeedbackItem(
  item: FeedbackItem & { creator?: { name: string } },
): ApiFeedbackItem {
  return {
    id: item.id,
    projectId: item.projectId,
    type: mapFeedbackType(item.type),
    status: item.status,
    problemDescription: item.problemDescription,
    definitionOfDone: item.definitionOfDone,
    deviceType: mapDeviceType(item.deviceType),
    hasLocation: item.hasLocation,
    pageUrl: item.pageUrl,
    cssSelector: item.cssSelector,
    x: item.x,
    y: item.y,
    screenshotUrl: item.screenshotUrl,
    deliveryDescription: item.deliveryDescription,
    linkedFeatureId: item.linkedFeatureId ?? undefined,
    createdBy: item.createdBy,
    createdByName: item.creator?.name,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function toApiFeedbackComment(
  comment: FeedbackComment & { user?: { name: string } },
): ApiFeedbackComment {
  return {
    id: comment.id,
    feedbackItemId: comment.feedbackItemId,
    userId: comment.userId,
    userName: comment.user?.name,
    text: comment.text,
    createdAt: comment.createdAt.toISOString(),
  };
}

export function toApiNotification(notification: Notification): ApiNotification {
  return {
    id: notification.id,
    userId: notification.userId,
    type: mapNotificationType(notification.type),
    referenceId: notification.referenceId,
    message: notification.message,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
  };
}

export function toPrismaRole(role: "admin" | "client"): UserRole {
  return role === "admin" ? "ADMIN" : "CLIENT";
}

export function toPrismaFeedbackType(type: "bug" | "feature"): FeedbackType {
  return type === "bug" ? "BUG" : "FEATURE";
}

export function toPrismaDeviceType(
  deviceType: "desktop" | "tablet" | "mobile",
): DeviceType {
  return deviceType.toUpperCase() as DeviceType;
}

export function toPrismaNotificationType(
  type: ApiNotification["type"],
): NotificationType {
  const map: Record<ApiNotification["type"], NotificationType> = {
    new_feedback: "NEW_FEEDBACK",
    new_bug: "NEW_BUG",
    new_feature: "NEW_FEATURE",
    new_comment: "NEW_COMMENT",
    status_change: "STATUS_CHANGE",
    mention: "MENTION",
  };
  return map[type];
}
