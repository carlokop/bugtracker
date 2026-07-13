import { Link } from "react-router-dom";
import { GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeviceTypeBadge } from "@/components/feedback/DeviceTypeBadge";
import { FeedbackTypeBadge } from "@/components/feedback/FeedbackTypeBadge";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { FeedbackItem } from "@/types";

interface KanbanCardProps {
  item: FeedbackItem;
  canDrag: boolean;
  canDelete: boolean;
  onDragStart: (e: React.DragEvent, itemId: string) => void;
  onDelete: (itemId: string) => void;
}

export function KanbanCard({
  item,
  canDrag,
  canDelete,
  onDragStart,
  onDelete,
}: KanbanCardProps) {
  return (
    <div
      draggable={canDrag}
      onDragStart={canDrag ? (e) => onDragStart(e, item.id) : undefined}
      className={cn(
        "group rounded-lg border border-border/60 bg-card p-3 shadow-xs transition-all hover:border-border hover:shadow-sm",
        canDrag && "cursor-grab active:cursor-grabbing",
      )}
    >
      <div className="mb-2 flex items-start gap-2">
        {canDrag && (
          <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100" />
        )}
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-sm font-medium leading-snug line-clamp-2">
            {item.problemDescription}
          </p>
          <p className="mb-2 text-xs leading-relaxed text-muted-foreground line-clamp-2">
            <span className="font-medium text-foreground/70">DoD:</span>{" "}
            {item.definitionOfDone}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive disabled:opacity-40"
          disabled={!canDelete}
          title={
            canDelete
              ? "Feedback verwijderen"
              : "Alleen verwijderbaar bij status Gedaan"
          }
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
        <FeedbackTypeBadge type={item.type} />
        <DeviceTypeBadge deviceType={item.deviceType} />
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
          {item.pageUrl}
        </span>
      </div>
      <div className="flex items-center justify-between border-t border-border/50 pt-2">
        <span className="text-xs text-muted-foreground">
          {formatDate(item.createdAt)}
        </span>
        <Link
          to={`/feedback/${item.id}`}
          className="text-xs font-medium text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Details
        </Link>
      </div>
    </div>
  );
}
