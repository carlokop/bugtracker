import { KanbanCard } from "@/components/feedback/KanbanCard";
import { Badge } from "@/components/ui/badge";
import {
  statusColumnHeaderVariants,
  statusColumnVariants,
} from "@/lib/status-styles";
import { cn } from "@/lib/utils";
import type { FeedbackItem, FeedbackStatus } from "@/types";
import { FEEDBACK_STATUS_LABELS } from "@/types";

interface KanbanColumnProps {
  status: FeedbackStatus;
  items: FeedbackItem[];
  onDragStart: (e: React.DragEvent, itemId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: FeedbackStatus) => void;
  onDelete: (itemId: string) => void;
  canDrag: boolean;
  isDragOver: boolean;
}

export function KanbanColumn({
  status,
  items,
  onDragStart,
  onDragOver,
  onDrop,
  onDelete,
  canDrag,
  isDragOver,
}: KanbanColumnProps) {
  return (
    <div
      className={cn(
        "flex min-h-[28rem] w-72 shrink-0 flex-col rounded-xl border shadow-sm transition-all md:w-auto md:flex-1",
        statusColumnVariants[status],
        canDrag && isDragOver && "ring-2 ring-ring ring-offset-2 ring-offset-background",
      )}
      onDragOver={canDrag ? onDragOver : undefined}
      onDrop={canDrag ? (e) => onDrop(e, status) : undefined}
    >
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <h3
          className={cn(
            "text-sm font-semibold",
            statusColumnHeaderVariants[status],
          )}
        >
          {FEEDBACK_STATUS_LABELS[status]}
        </h3>
        <Badge variant="outline" className="bg-background/80">
          {items.length}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {items.length === 0 ? (
          <p className="py-12 text-center text-xs text-muted-foreground">
            Geen items
          </p>
        ) : (
          items.map((item) => (
            <KanbanCard
              key={item.id}
              item={item}
              canDrag={canDrag}
              canDelete={canDrag && status === "done"}
              onDragStart={onDragStart}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
