import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ViewerFeatureFormProps {
  screenshotPreview?: string;
  deviceLabel: string;
  onSubmit: (problemDescription: string, definitionOfDone: string) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function ViewerFeatureForm({
  screenshotPreview,
  deviceLabel,
  onSubmit,
  onCancel,
  isSubmitting,
}: ViewerFeatureFormProps) {
  const [problemDescription, setProblemDescription] = useState("");
  const [definitionOfDone, setDefinitionOfDone] = useState("");

  const canSubmit =
    problemDescription.trim().length > 0 && definitionOfDone.trim().length > 0;

  return (
    <div className="absolute bottom-2 left-2 right-2 z-40 mx-auto max-w-md rounded-xl border bg-popover p-4 shadow-lg sm:bottom-4 sm:left-4 sm:right-4 md:left-auto md:right-4">
      <h3 className="mb-3 text-sm font-semibold tracking-tight">
        Feature toevoegen
      </h3>
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
        Apparaattype:{" "}
        <span className="font-medium text-foreground">{deviceLabel}</span>
      </p>
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="feature-desc">Wat wordt er gebouwd?</Label>
          <Textarea
            id="feature-desc"
            value={problemDescription}
            onChange={(e) => setProblemDescription(e.target.value)}
            placeholder="Beschrijf de feature die je gaat bouwen..."
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="feature-dod">Acceptatiecriteria</Label>
          <Textarea
            id="feature-dod"
            value={definitionOfDone}
            onChange={(e) => setDefinitionOfDone(e.target.value)}
            placeholder="Wanneer is deze feature klaar voor review door de klant?"
            rows={2}
          />
        </div>
        <div className="flex gap-2">
          <Button
            className="flex-1"
            disabled={!canSubmit || isSubmitting}
            onClick={() => onSubmit(problemDescription, definitionOfDone)}
          >
            {isSubmitting ? "Opslaan..." : "Feature toevoegen"}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Annuleren
          </Button>
        </div>
      </div>
    </div>
  );
}
