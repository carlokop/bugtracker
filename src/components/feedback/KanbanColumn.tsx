import { KanbanCard } from "@/components/feedback/KanbanCard";
import { Badge } from "@/components/ui/badge";
import {
  getStatusVariant,
  statusColumnHeaderVariants,
  statusColumnVariants,
} from "@/lib/status-styles";
import { cn } from "@/lib/utils";
import type { FeedbackItem, FeedbackType, ItemStatus } from "@/types";
import { getStatusLabel } from "@/types";

interface KanbanColumnProps {
  status: ItemStatus;
  itemType: FeedbackType;
  items: FeedbackItem[];
  onDragStart: (e: React.DragEvent, itemId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: ItemStatus) => void;
  onDelete: (itemId: string) => void;
  canDrag: boolean;
  isDragOver: boolean;
}

export function KanbanColumn({
  status,
  itemType,
  items,
  onDragStart,
  onDragOver,
  onDrop,
  onDelete,
  canDrag,
  isDragOver,
}: KanbanColumnProps) {
  const variant = getStatusVariant(status, itemType);

  return (
    <div
      className={cn(
        "flex min-h-[24rem] w-[min(85vw,18rem)] shrink-0 flex-col rounded-2xl border shadow-sm transition-all sm:min-h-[28rem] md:w-auto md:flex-1",
        statusColumnVariants[variant],
        canDrag &&
          isDragOver &&
          "ring-2 ring-ring ring-offset-2 ring-offset-background",
      )}
      onDragOver={canDrag ? onDragOver : undefined}
      onDrop={canDrag ? (e) => onDrop(e, status) : undefined}
    >
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <h3
          className={cn(
            "text-sm font-semibold",
            statusColumnHeaderVariants[variant],
          )}
        >
          {getStatusLabel(status, itemType)}
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
              canDelete={
                canDrag &&
                (item.type === "bug"
                  ? item.status === "done"
                  : item.status === "accepted")
              }
              onDragStart={onDragStart}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
