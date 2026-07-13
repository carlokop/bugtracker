import { Badge } from "@/components/ui/badge";
import type { FeedbackStatus } from "@/types";
import { FEEDBACK_STATUS_LABELS } from "@/types";

const statusVariant: Record<
  FeedbackStatus,
  "open" | "progress" | "review" | "done"
> = {
  open: "open",
  in_progress: "progress",
  in_review: "review",
  done: "done",
};

export function StatusBadge({ status }: { status: FeedbackStatus }) {
  return (
    <Badge variant={statusVariant[status]}>
      {FEEDBACK_STATUS_LABELS[status]}
    </Badge>
  );
}
