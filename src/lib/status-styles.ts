import type { BugStatus, FeatureStatus, ItemStatus } from "@/types";

type StatusVariant = "open" | "progress" | "review" | "done";

const bugStatusVariant: Record<BugStatus, StatusVariant> = {
  open: "open",
  in_progress: "progress",
  in_review: "review",
  done: "done",
};

const featureStatusVariant: Record<FeatureStatus, StatusVariant> = {
  requested: "open",
  approved: "progress",
  in_progress: "progress",
  delivered: "review",
  accepted: "done",
};

export function getStatusVariant(
  status: ItemStatus,
  type: "bug" | "feature",
): StatusVariant {
  if (type === "bug") {
    return bugStatusVariant[status as BugStatus];
  }
  return featureStatusVariant[status as FeatureStatus];
}

export const statusBadgeVariants: Record<StatusVariant, string> = {
  open: "bg-status-open text-status-open-foreground",
  progress: "bg-status-progress text-status-progress-foreground",
  review: "bg-status-review text-status-review-foreground",
  done: "bg-status-done text-status-done-foreground",
};

export const statusColumnVariants: Record<StatusVariant, string> = {
  open: "border-status-open/30 bg-status-open/20",
  progress: "border-status-progress/30 bg-status-progress/20",
  review: "border-status-review/30 bg-status-review/20",
  done: "border-status-done/30 bg-status-done/20",
};

export const statusColumnHeaderVariants: Record<StatusVariant, string> = {
  open: "text-status-open-foreground",
  progress: "text-status-progress-foreground",
  review: "text-status-review-foreground",
  done: "text-status-done-foreground",
};
