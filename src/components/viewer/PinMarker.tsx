import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeedbackItem } from "@/types";

interface PinMarkerProps {
  item: FeedbackItem;
  index: number;
  isActive?: boolean;
  onClick?: () => void;
}

export function PinMarker({ item, index, isActive, onClick }: PinMarkerProps) {
  return (
    <button
      className={cn(
        "absolute z-20 flex h-8 w-8 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110",
        isActive
          ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
          : "bg-red-500 text-white",
      )}
      style={{ left: item.x, top: item.y }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      title={item.problemDescription}
    >
      <span className="text-xs font-bold">{index + 1}</span>
    </button>
  );
}

export function PendingPin({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="absolute z-30 flex h-8 w-8 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-2 ring-primary ring-offset-2 animate-pulse"
      style={{ left: x, top: y }}
    >
      <MapPin className="h-4 w-4" />
    </div>
  );
}
