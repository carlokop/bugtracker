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
      className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-xl"
    >
      <Input
        type="url"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="https://voorbeeld.nl of /contact"
        className="h-8 bg-background font-mono text-xs sm:text-sm"
        spellCheck={false}
      />
      <Button type="submit" size="sm" variant="secondary" className="shrink-0">
        <ArrowRight className="h-4 w-4" />
        <span className="hidden sm:inline">Ga</span>
      </Button>
      {defaultUrl && value !== defaultUrl && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0"
          title="Terug naar project-URL"
          onClick={handleReset}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      )}
    </form>
  );
}
