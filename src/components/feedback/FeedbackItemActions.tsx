import { Bug, CheckCircle, Eye, MapPin, Play, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FeedbackItem, ItemStatus } from "@/types";
import {
  BOARD_STATUSES,
  BUG_STATUS_LABELS,
  FEATURE_BOARD_STATUSES,
  FEATURE_STATUS_LABELS,
} from "@/types";

interface FeedbackItemActionsProps {
  item: FeedbackItem;
  isAdmin: boolean;
  isClient: boolean;
  onStatusChange: (status: ItemStatus) => void;
  onAdminStartWork?: () => void;
  onAdminReadyForReview?: () => void;
  onApproval: (approved: boolean) => void;
  onUndoApproval: () => void;
  onFeatureApprove?: () => void;
  onFeatureStart?: () => void;
  onFeatureDeliver?: () => void;
  onFeatureAccept?: (accepted: boolean) => void;
  onFeatureConvertToBug?: () => void;
  onFeatureUndoAccept?: () => void;
}

export function FeedbackItemActions({
  item,
  isAdmin,
  isClient,
  onStatusChange,
  onAdminStartWork,
  onAdminReadyForReview,
  onApproval,
  onUndoApproval,
  onFeatureApprove,
  onFeatureStart,
  onFeatureDeliver,
  onFeatureAccept,
  onFeatureConvertToBug,
  onFeatureUndoAccept,
}: FeedbackItemActionsProps) {
  if (item.type === "bug") {
    return (
      <BugActions
        item={item}
        isAdmin={isAdmin}
        isClient={isClient}
        onStatusChange={onStatusChange}
        onAdminStartWork={onAdminStartWork}
        onAdminReadyForReview={onAdminReadyForReview}
        onApproval={onApproval}
        onUndoApproval={onUndoApproval}
      />
    );
  }

  return (
    <FeatureActions
      item={item}
      isAdmin={isAdmin}
      isClient={isClient}
      onStatusChange={onStatusChange}
      onFeatureApprove={onFeatureApprove}
      onFeatureStart={onFeatureStart}
      onFeatureDeliver={onFeatureDeliver}
      onFeatureAccept={onFeatureAccept}
      onFeatureConvertToBug={onFeatureConvertToBug}
      onFeatureUndoAccept={onFeatureUndoAccept}
    />
  );
}

function BugActions({
  item,
  isAdmin,
  isClient,
  onStatusChange,
  onAdminStartWork,
  onAdminReadyForReview,
  onApproval,
  onUndoApproval,
}: Pick<
  FeedbackItemActionsProps,
  | "item"
  | "isAdmin"
  | "isClient"
  | "onStatusChange"
  | "onAdminStartWork"
  | "onAdminReadyForReview"
  | "onApproval"
  | "onUndoApproval"
>) {
  const showClientReview = item.status === "in_review" && isClient;
  const showAdminWaitingForReview =
    item.status === "in_review" && isAdmin && !isClient;
  const showUndoApproval = item.status === "done";

  return (
    <div className="space-y-4 border-t border-border/60 pt-4">
      {isAdmin && item.status === "open" && onAdminStartWork && (
        <div className="rounded-lg border border-status-open/30 bg-status-open/10 p-4">
          <h3 className="mb-2 text-sm font-medium">Aan de slag</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Geef aan dat je aan deze bug werkt. De klant wordt op de hoogte
            gesteld.
          </p>
          <Button size="sm" onClick={onAdminStartWork}>
            <Play className="h-4 w-4" />
            In behandeling nemen
          </Button>
        </div>
      )}

      {isAdmin && item.status === "in_progress" && onAdminReadyForReview && (
        <div className="rounded-lg border border-status-progress/30 bg-status-progress/10 p-4">
          <h3 className="mb-2 text-sm font-medium">Klaar voor review</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            De fix is klaar. Vraag de klant om te controleren of de bug is
            opgelost.
          </p>
          <Button size="sm" onClick={onAdminReadyForReview}>
            <Eye className="h-4 w-4" />
            Ter goedkeuring — vraag klant om te kijken
          </Button>
        </div>
      )}

      {showClientReview && (
        <div className="space-y-3 rounded-lg border border-status-review/30 bg-status-review/10 p-4">
          <h3 className="text-sm font-medium">Controleer de fix</h3>
          <p className="text-sm text-muted-foreground">
            De developer heeft aangegeven dat deze bug is opgelost. Controleer
            of het probleem naar tevredenheid is verholpen.
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

      {showAdminWaitingForReview && (
        <div className="rounded-lg border border-status-review/30 bg-status-review/10 p-4">
          <h3 className="text-sm font-medium">Wacht op klantreview</h3>
          <p className="text-sm text-muted-foreground">
            De klant is gevraagd om te controleren of deze bug is opgelost.
          </p>
        </div>
      )}

      {showUndoApproval && (
        <div className="space-y-3 rounded-lg border border-status-done/30 bg-status-done/10 p-4">
          <h3 className="text-sm font-medium">Goedgekeurd</h3>
          <p className="text-sm text-muted-foreground">
            Deze bug is goedgekeurd door de klant.
          </p>
          {(isAdmin || isClient) && (
            <Button size="sm" variant="outline" onClick={onUndoApproval}>
              <RotateCcw className="h-4 w-4" />
              Goedkeuring ongedaan maken
            </Button>
          )}
        </div>
      )}

      {isClient && item.status === "open" && (
        <p className="text-sm text-muted-foreground">
          De developer neemt deze bug in behandeling zodra hij eraan werkt.
        </p>
      )}

      {isClient && item.status === "in_progress" && (
        <p className="text-sm text-muted-foreground">
          De developer werkt aan deze bug. Je ontvangt een melding zodra je
          kunt controleren of het is opgelost.
        </p>
      )}

      {isAdmin && (
        <div className="space-y-2">
          <Label htmlFor="feedback-status">Status handmatig wijzigen</Label>
          <Select
            value={item.status}
            onValueChange={(v) => onStatusChange(v as ItemStatus)}
          >
            <SelectTrigger id="feedback-status" className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BOARD_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {BUG_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

function FeatureActions({
  item,
  isAdmin,
  isClient,
  onStatusChange,
  onFeatureApprove,
  onFeatureStart,
  onFeatureDeliver,
  onFeatureAccept,
  onFeatureConvertToBug,
  onFeatureUndoAccept,
}: Pick<
  FeedbackItemActionsProps,
  | "item"
  | "isAdmin"
  | "isClient"
  | "onStatusChange"
  | "onFeatureApprove"
  | "onFeatureStart"
  | "onFeatureDeliver"
  | "onFeatureAccept"
  | "onFeatureConvertToBug"
  | "onFeatureUndoAccept"
>) {
  const showClientAcceptance = item.status === "delivered" && isClient;
  const showAdminWaitingForAcceptance =
    item.status === "delivered" && isAdmin && !isClient;

  return (
    <div className="space-y-4 border-t border-border/60 pt-4">
      {isAdmin && item.status === "requested" && onFeatureApprove && (
        <div className="rounded-lg border border-status-open/30 bg-status-open/10 p-4">
          <h3 className="mb-2 text-sm font-medium">Feature plannen</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Zet deze feature klaar om mee te starten.
          </p>
          <Button size="sm" onClick={onFeatureApprove}>
            <CheckCircle className="h-4 w-4" />
            Goedkeuren
          </Button>
        </div>
      )}

      {isAdmin && item.status === "approved" && onFeatureStart && (
        <div className="rounded-lg border border-status-progress/30 bg-status-progress/10 p-4">
          <h3 className="mb-2 text-sm font-medium">Start ontwikkeling</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Geef aan dat je aan deze feature werkt.
          </p>
          <Button size="sm" onClick={onFeatureStart}>
            <Play className="h-4 w-4" />
            In ontwikkeling nemen
          </Button>
        </div>
      )}

      {isAdmin && item.status === "in_progress" && onFeatureDeliver && (
        <div className="rounded-lg border border-status-progress/30 bg-status-progress/10 p-4">
          <h3 className="mb-2 text-sm font-medium">Klaar voor review</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            Plaats een marker op de pagina waar de feature is gebouwd en leg
            uit wat de klant moet controleren.
          </p>
          <Button size="sm" onClick={onFeatureDeliver}>
            <MapPin className="h-4 w-4" />
            Locatie aangeven en opleveren
          </Button>
        </div>
      )}

      {showClientAcceptance && (
        <div className="space-y-3 rounded-lg border border-status-review/30 bg-status-review/10 p-4">
          <h3 className="text-sm font-medium">Beoordeel de feature</h3>
          <p className="text-sm text-muted-foreground">
            De developer heeft deze feature opgeleverd. Accepteer als het goed
            is, of zet om naar een bug als het niet klopt.
          </p>
          <div className="flex flex-wrap gap-2">
            {onFeatureAccept && (
              <Button size="sm" onClick={() => onFeatureAccept(true)}>
                <CheckCircle className="h-4 w-4" />
                Accepteren
              </Button>
            )}
            {onFeatureConvertToBug && (
              <Button
                size="sm"
                variant="outline"
                onClick={onFeatureConvertToBug}
              >
                <Bug className="h-4 w-4" />
                Omzetten naar bug
              </Button>
            )}
          </div>
        </div>
      )}

      {showAdminWaitingForAcceptance && (
        <div className="rounded-lg border border-status-review/30 bg-status-review/10 p-4">
          <h3 className="text-sm font-medium">Wacht op klantreview</h3>
          <p className="text-sm text-muted-foreground">
            De klant is gevraagd om te controleren of deze feature naar wens is.
          </p>
        </div>
      )}

      {item.status === "accepted" && onFeatureUndoAccept && (
        <div className="space-y-3 rounded-lg border border-status-done/30 bg-status-done/10 p-4">
          <h3 className="text-sm font-medium">Geaccepteerd</h3>
          {(isAdmin || isClient) && (
            <Button size="sm" variant="outline" onClick={onFeatureUndoAccept}>
              <RotateCcw className="h-4 w-4" />
              Acceptatie ongedaan maken
            </Button>
          )}
        </div>
      )}

      {isClient && item.status === "in_progress" && (
        <p className="text-sm text-muted-foreground">
          De developer werkt aan deze feature. Je ontvangt een melding zodra je
          kunt controleren of het klaar is.
        </p>
      )}

      {isAdmin && (
        <div className="space-y-2">
          <Label htmlFor="feature-status">Status handmatig wijzigen</Label>
          <Select
            value={item.status}
            onValueChange={(v) => onStatusChange(v as ItemStatus)}
          >
            <SelectTrigger id="feature-status" className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FEATURE_BOARD_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {FEATURE_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
