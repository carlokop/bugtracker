import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BugReportFormProps {
  screenshotPreview?: string;
  deviceLabel: string;
  onSubmit: (problemDescription: string, definitionOfDone: string) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  title?: string;
  submitLabel?: string;
}

export function BugReportForm({
  screenshotPreview,
  deviceLabel,
  onSubmit,
  onCancel,
  isSubmitting,
  title = "Feedback geven",
  submitLabel = "Feedback opslaan",
}: BugReportFormProps) {
  const [problemDescription, setProblemDescription] = useState("");
  const [definitionOfDone, setDefinitionOfDone] = useState("");

  const canSubmit =
    problemDescription.trim().length > 0 && definitionOfDone.trim().length > 0;

  return (
    <div className="absolute inset-x-0 bottom-0 z-40 max-h-[85dvh] overflow-y-auto rounded-t-2xl border border-border/80 bg-popover/98 p-4 shadow-xl backdrop-blur-md sm:inset-x-auto sm:bottom-4 sm:left-4 sm:right-4 sm:max-h-none sm:max-w-md sm:rounded-2xl sm:p-5 md:left-auto md:right-4">
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border sm:hidden" />
      <h3 className="mb-3 text-base font-semibold tracking-tight">{title}</h3>
      {screenshotPreview && (
        <div className="mb-3 overflow-hidden rounded-xl border">
          <img
            src={screenshotPreview}
            alt="Screenshot preview"
            className="h-28 w-full object-cover object-top sm:h-32"
          />
        </div>
      )}
      <p className="mb-3 text-xs text-muted-foreground">
        Apparaattype:{" "}
        <span className="font-medium text-foreground">{deviceLabel}</span>
      </p>
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="bug-problem">Wat is je feedback?</Label>
          <Textarea
            id="bug-problem"
            value={problemDescription}
            onChange={(e) => setProblemDescription(e.target.value)}
            placeholder="Beschrijf wat er mis is of wat niet klopt..."
            rows={3}
            className="text-base sm:text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bug-expected">Hoe hoort het te werken?</Label>
          <Textarea
            id="bug-expected"
            value={definitionOfDone}
            onChange={(e) => setDefinitionOfDone(e.target.value)}
            placeholder="Beschrijf het verwachte gedrag..."
            rows={2}
            className="text-base sm:text-sm"
          />
        </div>
        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row">
          <Button variant="outline" className="w-full sm:w-auto" onClick={onCancel}>
            Annuleren
          </Button>
          <Button
            className="w-full flex-1"
            disabled={!canSubmit || isSubmitting}
            onClick={() => onSubmit(problemDescription, definitionOfDone)}
          >
            {isSubmitting ? "Opslaan..." : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
