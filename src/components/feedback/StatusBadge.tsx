import { Badge } from "@/components/ui/badge";
import type { FeedbackItem } from "@/types";
import { getStatusLabel } from "@/types";
import { getStatusVariant } from "@/lib/status-styles";

export function StatusBadge({ item }: { item: FeedbackItem }) {
  const variant = getStatusVariant(item.status, item.type);
  return (
    <Badge variant={variant}>
      {getStatusLabel(item.status, item.type)}
    </Badge>
  );
}
