import { Link } from "react-router-dom";
import { Bug, Sparkles } from "lucide-react";
import { StatusBadge } from "@/components/feedback/StatusBadge";
import { DeviceTypeBadge } from "@/components/feedback/DeviceTypeBadge";
import { formatDate } from "@/lib/utils";
import type { FeedbackItem } from "@/types";

interface ViewerPageFeedbackListProps {
  bugs: FeedbackItem[];
  features: FeedbackItem[];
  pageUrl: string;
  activeItemId?: string | null;
  onItemClick?: (item: FeedbackItem) => void;
}

function FeedbackListItem({
  item,
  isActive,
  onClick,
}: {
  item: FeedbackItem;
  isActive: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <StatusBadge item={item} />
        <DeviceTypeBadge deviceType={item.deviceType} />
        {item.hasLocation && (
          <span className="text-xs text-muted-foreground">Met marker</span>
        )}
      </div>
      <p className="mb-1 text-sm font-medium leading-snug line-clamp-2">
        {item.problemDescription}
      </p>
      <p className="text-xs text-muted-foreground">
        {formatDate(item.createdAt)}
      </p>
    </>
  );

  const className = `block rounded-xl border p-3 transition-all ${
    isActive
      ? "border-primary bg-primary/5 shadow-sm"
      : "border-border/80 bg-card hover:border-border hover:bg-accent/30"
  }`;

  if (item.hasLocation && onClick) {
    return (
      <button type="button" className={`w-full text-left ${className}`} onClick={onClick}>
        {content}
      </button>
    );
  }

  return (
    <Link to={`/feedback/${item.id}`} className={className}>
      {content}
    </Link>
  );
}

export function ViewerPageFeedbackList({
  bugs,
  features,
  pageUrl,
  activeItemId,
  onItemClick,
}: ViewerPageFeedbackListProps) {
  const total = bugs.length + features.length;

  if (total === 0) {
    return (
      <div className="border-t bg-background px-4 py-6">
        <p className="text-center text-sm text-muted-foreground">
          Nog geen bugs of features op{" "}
          <span className="font-mono text-foreground">{pageUrl}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-border/80 bg-background px-3 py-5 sm:px-4 sm:py-6">
      <div className="mx-auto max-w-5xl space-y-5 sm:space-y-6">
        <div>
          <h2 className="text-base font-semibold sm:text-lg">
            Feedback op deze pagina
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            {total} item{total !== 1 ? "s" : ""} op{" "}
            <span className="font-mono text-foreground">{pageUrl}</span>
          </p>
        </div>

        <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Bug className="h-4 w-4 text-destructive" />
              Bugs ({bugs.length})
            </h3>
            {bugs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Geen bugs op deze pagina.</p>
            ) : (
              <div className="space-y-2">
                {bugs.map((item) => (
                  <FeedbackListItem
                    key={item.id}
                    item={item}
                    isActive={activeItemId === item.id}
                    onClick={
                      item.hasLocation
                        ? () => onItemClick?.(item)
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Features ({features.length})
            </h3>
            {features.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Geen features op deze pagina.
              </p>
            ) : (
              <div className="space-y-2">
                {features.map((item) => (
                  <FeedbackListItem
                    key={item.id}
                    item={item}
                    isActive={activeItemId === item.id}
                    onClick={
                      item.hasLocation
                        ? () => onItemClick?.(item)
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
