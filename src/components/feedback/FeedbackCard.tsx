import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/feedback/StatusBadge";
import { DeviceTypeBadge } from "@/components/feedback/DeviceTypeBadge";
import { FeedbackTypeBadge } from "@/components/feedback/FeedbackTypeBadge";
import { formatDate } from "@/lib/utils";
import type { FeedbackItem } from "@/types";

export function FeedbackCard({ item }: { item: FeedbackItem }) {
  return (
    <Link
      to={`/feedback/${item.id}`}
      className="block rounded-xl border bg-card p-4 shadow-xs transition-all hover:border-border hover:shadow-sm"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <StatusBadge item={item} />
        <FeedbackTypeBadge type={item.type} />
        <DeviceTypeBadge deviceType={item.deviceType} />
        {item.hasLocation && item.pageUrl ? (
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {item.pageUrl}
          </span>
        ) : (
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            Geen locatie
          </span>
        )}
      </div>
      <p className="mb-1 text-sm font-medium leading-snug line-clamp-2">
        {item.problemDescription}
      </p>
      <p className="mb-3 text-xs leading-relaxed text-muted-foreground line-clamp-1">
        {item.definitionOfDone}
      </p>
      <p className="text-xs text-muted-foreground">
        {formatDate(item.createdAt)}
      </p>
    </Link>
  );
}
