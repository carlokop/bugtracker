import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { MockWebsite } from "@/mock/MockWebsite";
import { ScreenshotPin } from "@/components/feedback/ScreenshotPin";
import type { FeedbackItem } from "@/types";

const MOCK_PAGE_WIDTH = 800;

interface FeedbackScreenshotProps {
  item: FeedbackItem;
}

export function FeedbackScreenshot({ item }: FeedbackScreenshotProps) {
  if (!item.hasLocation || item.x == null || item.y == null) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed bg-muted/30 p-8 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 shrink-0" />
        Geen locatie op de site aangegeven
      </div>
    );
  }

  if (item.screenshotUrl) {
    return <CapturedScreenshot item={item} />;
  }
  return <MockPagePreview item={item} />;
}

function CapturedScreenshot({ item }: { item: FeedbackItem }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pinPos, setPinPos] = useState({ x: item.x!, y: item.y! });

  const updatePinPosition = useCallback(() => {
    const container = containerRef.current;
    const img = container?.querySelector("img");
    if (!img?.naturalWidth) return;

    const scale = img.clientWidth / img.naturalWidth;
    setPinPos({ x: item.x! * scale, y: item.y! * scale });
  }, [item.x, item.y]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(updatePinPosition);
    observer.observe(container);
    return () => observer.disconnect();
  }, [updatePinPosition]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl border bg-muted/30"
    >
      <img
        src={item.screenshotUrl!}
        alt="Screenshot van feedback-locatie"
        className="block w-full"
        onLoad={updatePinPosition}
      />
      <ScreenshotPin x={pinPos.x} y={pinPos.y} />
    </div>
  );
}

function MockPagePreview({ item }: { item: FeedbackItem }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      setScale(el.clientWidth / MOCK_PAGE_WIDTH);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!item.pageUrl) return null;

  return (
    <div
      ref={containerRef}
      className="relative aspect-[4/3] w-full max-h-[28rem] overflow-hidden rounded-xl border bg-background shadow-sm"
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          width: MOCK_PAGE_WIDTH,
          transform: `scale(${scale})`,
        }}
      >
        <MockWebsite pageUrl={item.pageUrl} />
      </div>
      <ScreenshotPin x={item.x! * scale} y={item.y! * scale} />
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-border/50" />
    </div>
  );
}
