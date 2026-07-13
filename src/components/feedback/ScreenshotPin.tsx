import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScreenshotPinProps {
  x: number;
  y: number;
  className?: string;
}

export function ScreenshotPin({ x, y, className }: ScreenshotPinProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg ring-2 ring-background",
        className,
      )}
      style={{ left: x, top: y }}
      aria-hidden
    >
      <MapPin className="h-4 w-4" />
    </div>
  );
}
