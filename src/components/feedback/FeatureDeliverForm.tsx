import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface FeatureDeliverFormProps {
  featureTitle: string;
  screenshotPreview?: string;
  deviceLabel: string;
  onSubmit: (deliveryDescription: string) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function FeatureDeliverForm({
  featureTitle,
  screenshotPreview,
  deviceLabel,
  onSubmit,
  onCancel,
  isSubmitting,
}: FeatureDeliverFormProps) {
  const [deliveryDescription, setDeliveryDescription] = useState("");

  const canSubmit = deliveryDescription.trim().length > 0;

  return (
    <div className="absolute bottom-2 left-2 right-2 z-40 mx-auto max-w-md rounded-xl border bg-popover p-4 shadow-lg sm:bottom-4 sm:left-4 sm:right-4 md:left-auto md:right-4">
      <h3 className="mb-1 text-sm font-semibold tracking-tight">
        Feature opleveren
      </h3>
      <p className="mb-3 text-xs text-muted-foreground line-clamp-2">
        {featureTitle}
      </p>
      {screenshotPreview && (
        <div className="mb-3 overflow-hidden rounded-md border">
          <img
            src={screenshotPreview}
            alt="Locatie preview"
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
          <Label htmlFor="delivery-desc">Wat is hier gebouwd?</Label>
          <Textarea
            id="delivery-desc"
            value={deliveryDescription}
            onChange={(e) => setDeliveryDescription(e.target.value)}
            placeholder="Leg uit wat je op deze plek hebt gebouwd, zodat de klant het kan beoordelen..."
            rows={4}
          />
        </div>
        <div className="flex gap-2">
          <Button
            className="flex-1"
            disabled={!canSubmit || isSubmitting}
            onClick={() => onSubmit(deliveryDescription)}
          >
            {isSubmitting ? "Opslaan..." : "Opleveren aan klant"}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Annuleren
          </Button>
        </div>
      </div>
    </div>
  );
}
