import { useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ViewerUrlBarProps {
  value: string;
  defaultUrl?: string;
  onNavigate: (url: string) => void;
}

export function ViewerUrlBar({
  value,
  defaultUrl,
  onNavigate,
}: ViewerUrlBarProps) {
  const [input, setInput] = useState(value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate(input);
  };

  const handleReset = () => {
    if (!defaultUrl) return;
    setInput(defaultUrl);
    onNavigate(defaultUrl);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full min-w-0 items-center gap-2"
    >
      <Input
        type="url"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="URL of pad, bijv. /contact"
        className="h-10 min-w-0 flex-1 bg-background font-mono text-xs sm:text-sm"
        spellCheck={false}
      />
      <Button type="submit" size="icon" variant="secondary" className="shrink-0" aria-label="Navigeer">
        <ArrowRight className="h-4 w-4" />
      </Button>
      {defaultUrl && value !== defaultUrl && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="shrink-0"
          title="Terug naar project-URL"
          aria-label="Reset URL"
          onClick={handleReset}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      )}
    </form>
  );
}
