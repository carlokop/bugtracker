import type { FeedbackStatus } from "@/types";

export const statusBadgeVariants: Record<FeedbackStatus, string> = {
  open: "bg-status-open text-status-open-foreground",
  in_progress: "bg-status-progress text-status-progress-foreground",
  in_review: "bg-status-review text-status-review-foreground",
  done: "bg-status-done text-status-done-foreground",
};

export const statusColumnVariants: Record<FeedbackStatus, string> = {
  open: "border-status-open/30 bg-status-open/20",
  in_progress: "border-status-progress/30 bg-status-progress/20",
  in_review: "border-status-review/30 bg-status-review/20",
  done: "border-status-done/30 bg-status-done/20",
};

export const statusColumnHeaderVariants: Record<FeedbackStatus, string> = {
  open: "text-status-open-foreground",
  in_progress: "text-status-progress-foreground",
  in_review: "text-status-review-foreground",
  done: "text-status-done-foreground",
};
