import { useState } from "react";
import { Bug, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { FeedbackType } from "@/types";
import { FEEDBACK_TYPE_LABELS } from "@/types";

interface FeedbackFormProps {
  screenshotPreview?: string;
  deviceLabel: string;
  onSubmit: (
    problemDescription: string,
    definitionOfDone: string,
    type: FeedbackType,
  ) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  fixedType?: FeedbackType;
  title?: string;
  problemLabel?: string;
  submitLabel?: string;
}

export function FeedbackForm({
  screenshotPreview,
  deviceLabel,
  onSubmit,
  onCancel,
  isSubmitting,
  fixedType,
  title = "Nieuwe feedback",
  problemLabel = "Probleem beschrijven",
  submitLabel = "Opslaan",
}: FeedbackFormProps) {
  const [problemDescription, setProblemDescription] = useState("");
  const [definitionOfDone, setDefinitionOfDone] = useState("");
  const [type, setType] = useState<FeedbackType>(fixedType ?? "bug");

  const effectiveType = fixedType ?? type;
  const canSubmit =
    problemDescription.trim().length > 0 && definitionOfDone.trim().length > 0;

  return (
    <div className="absolute bottom-2 left-2 right-2 z-40 mx-auto max-w-md rounded-xl border bg-popover p-4 shadow-lg sm:bottom-4 sm:left-4 sm:right-4 md:left-auto md:right-4">
      <h3 className="mb-3 text-sm font-semibold tracking-tight">{title}</h3>
      {screenshotPreview && (
        <div className="mb-3 overflow-hidden rounded-md border">
          <img
            src={screenshotPreview}
            alt="Screenshot preview"
            className="h-32 w-full object-cover object-top"
          />
        </div>
      )}
      <p className="mb-3 text-xs text-muted-foreground">
        Apparaattype: <span className="font-medium text-foreground">{deviceLabel}</span>{" "}
        (automatisch op basis van orientatie)
      </p>
      <div className="space-y-3">
        {!fixedType && (
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex rounded-lg border p-1">
              {(["bug", "feature"] as FeedbackType[]).map((t) => {
                const Icon = t === "bug" ? Bug : Sparkles;
                return (
                  <button
                    key={t}
                    type="button"
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      type === t
                        ? t === "bug"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => setType(t)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {FEEDBACK_TYPE_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {fixedType && (
          <p className="text-xs font-medium text-destructive">
            Type: {FEEDBACK_TYPE_LABELS[fixedType]}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="problem-description">{problemLabel}</Label>
          <Textarea
            id="problem-description"
            value={problemDescription}
            onChange={(e) => setProblemDescription(e.target.value)}
            placeholder="Beschrijf wat er mis is..."
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="definition-of-done">Definition of done</Label>
          <Textarea
            id="definition-of-done"
            value={definitionOfDone}
            onChange={(e) => setDefinitionOfDone(e.target.value)}
            placeholder="Wanneer is dit punt afgerond?"
            rows={2}
          />
        </div>
        <div className="flex gap-2">
          <Button
            className="flex-1"
            disabled={!canSubmit || isSubmitting}
            onClick={() =>
              onSubmit(problemDescription, definitionOfDone, effectiveType)
            }
          >
            {isSubmitting ? "Opslaan..." : submitLabel}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Annuleren
          </Button>
        </div>
      </div>
    </div>
  );
}
