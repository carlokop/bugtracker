import { Bug, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { FeedbackType } from "@/types";
import { FEEDBACK_TYPE_LABELS } from "@/types";

const typeConfig: Record<
  FeedbackType,
  { variant: "bug" | "feature"; icon: typeof Bug }
> = {
  bug: { variant: "bug", icon: Bug },
  feature: { variant: "feature", icon: Sparkles },
};

export function FeedbackTypeBadge({ type }: { type: FeedbackType }) {
  const { variant, icon: Icon } = typeConfig[type];
  return (
    <Badge variant={variant}>
      <Icon className="h-3 w-3" />
      {FEEDBACK_TYPE_LABELS[type]}
    </Badge>
  );
}
