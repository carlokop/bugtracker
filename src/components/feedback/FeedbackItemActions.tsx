import { CheckCircle, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FeedbackItem, FeedbackStatus } from "@/types";
import { BOARD_STATUSES, FEEDBACK_STATUS_LABELS } from "@/types";

interface FeedbackItemActionsProps {
  item: FeedbackItem;
  isAdmin: boolean;
  isClient: boolean;
  onStatusChange: (status: FeedbackStatus) => void;
  onClientMarkDone: () => void;
  onApproval: (approved: boolean) => void;
  onUndoApproval: () => void;
}

export function FeedbackItemActions({
  item,
  isAdmin,
  isClient,
  onStatusChange,
  onClientMarkDone,
  onApproval,
  onUndoApproval,
}: FeedbackItemActionsProps) {
  const showApproval = item.status === "in_review" && (isAdmin || isClient);
  const showUndoApproval = item.status === "done" && (isAdmin || isClient);

  return (
    <div className="space-y-4 border-t border-border/60 pt-4">
      {showApproval && (
        <div className="space-y-3 rounded-lg border border-status-review/30 bg-status-review/10 p-4">
          <h3 className="text-sm font-medium">Goedkeuring</h3>
          <p className="text-sm text-muted-foreground">
            {isClient
              ? "Controleer of dit punt naar tevredenheid is opgelost en keur goed of wijs af."
              : "De klant heeft aangegeven dat dit gedaan is. Keur goed of wijs af."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => onApproval(true)}>
              <CheckCircle className="h-4 w-4" />
              Goedkeuren
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onApproval(false)}
            >
              <XCircle className="h-4 w-4" />
              Afkeuren
            </Button>
          </div>
        </div>
      )}

      {showUndoApproval && (
        <div className="space-y-3 rounded-lg border border-status-done/30 bg-status-done/10 p-4">
          <h3 className="text-sm font-medium">Goedgekeurd</h3>
          <p className="text-sm text-muted-foreground">
            Dit feedback-item is goedgekeurd. Je kunt de goedkeuring ongedaan
            maken om het opnieuw ter goedkeuring te zetten.
          </p>
          <Button size="sm" variant="outline" onClick={onUndoApproval}>
            <RotateCcw className="h-4 w-4" />
            Goedkeuring ongedaan maken
          </Button>
        </div>
      )}

      {isClient && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Jouw actie</h3>
          {item.status === "in_progress" && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="mb-3 text-sm text-muted-foreground">
                Is dit punt naar tevredenheid opgelost? Geef het aan ter
                goedkeuring.
              </p>
              <Button size="sm" onClick={onClientMarkDone}>
                <CheckCircle className="h-4 w-4" />
                Aangeven als gedaan
              </Button>
            </div>
          )}
          {item.status === "open" && (
            <p className="text-sm text-muted-foreground">
              Zodra de developer aan dit punt werkt, kun je hier aangeven of het
              gedaan is.
            </p>
          )}
        </div>
      )}

      {isAdmin && (
        <div className="space-y-2">
          <Label htmlFor="feedback-status">Status wijzigen</Label>
          <Select
            value={item.status}
            onValueChange={(v) => onStatusChange(v as FeedbackStatus)}
          >
            <SelectTrigger id="feedback-status" className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BOARD_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {FEEDBACK_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
