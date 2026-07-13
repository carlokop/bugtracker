import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/feedback/StatusBadge";
import { DeviceTypeBadge } from "@/components/feedback/DeviceTypeBadge";
import { FeedbackTypeBadge } from "@/components/feedback/FeedbackTypeBadge";
import { FeedbackScreenshot } from "@/components/feedback/FeedbackScreenshot";
import { FeedbackItemActions } from "@/components/feedback/FeedbackItemActions";
import { CommentThread } from "@/components/feedback/CommentThread";
import { useAuthStore } from "@/store/useAuthStore";
import { useFeedbackStore } from "@/store/useFeedbackStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useProjectStore } from "@/store/useProjectStore";
import { MOCK_USERS } from "@/mock/seed";
import { formatDate } from "@/lib/utils";
import type { FeedbackComment, FeedbackItem, ItemStatus } from "@/types";
import { getStatusLabel } from "@/types";

export function FeedbackDetailPage() {
  const { feedbackId } = useParams<{ feedbackId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const {
    getFeedbackItem,
    updateStatus,
    addComment,
    getComments,
  } = useFeedbackStore();
  const { addNotification } = useNotificationStore();
  const { getProject } = useProjectStore();

  const [item, setItem] = useState<FeedbackItem | null>(null);
  const [comments, setComments] = useState<FeedbackComment[]>([]);
  const [newComment, setNewComment] = useState("");

  const load = async () => {
    if (!feedbackId) return;
    const fb = await getFeedbackItem(feedbackId);
    setItem(fb ?? null);
    const cmts = await getComments(feedbackId);
    setComments(cmts);
  };

  useEffect(() => {
    load();
  }, [feedbackId]);

  const notifyCreator = async (
    message: string,
    targetItem: FeedbackItem = item!,
  ) => {
    if (!currentUser || !targetItem) return;
    const creator = MOCK_USERS.find((u) => u.id === targetItem.createdBy);
    if (creator && creator.id !== currentUser.id) {
      await addNotification(
        creator.id,
        "status_change",
        targetItem.id,
        message,
      );
    }
  };

  const handleStatusChange = async (status: ItemStatus) => {
    if (!item || !currentUser || currentUser.role !== "admin") return;
    if (item.status === status) return;
    const updated = await updateStatus(item.id, status);
    setItem(updated);
    await notifyCreator(
      `Status gewijzigd naar "${getStatusLabel(status, item.type)}"`,
    );
  };

  const handleBugApproval = async (approved: boolean) => {
    if (!item || item.type !== "bug" || item.status !== "in_review") return;
    if (currentUser?.role !== "client") return;
    const status: ItemStatus = approved ? "done" : "in_progress";
    const updated = await updateStatus(item.id, status);
    setItem(updated);

    const project = await getProject(item.projectId);
    if (!project || !currentUser) return;

    await addNotification(
      project.adminId,
      "status_change",
      item.id,
      approved ? "Klant heeft bug goedgekeurd" : "Klant heeft bug afgekeurd",
    );
  };

  const handleBugUndoApproval = async () => {
    if (!item || item.type !== "bug" || item.status !== "done") return;
    if (
      !window.confirm(
        "Weet je zeker dat je de goedkeuring ongedaan wilt maken?",
      )
    ) {
      return;
    }
    const updated = await updateStatus(item.id, "in_review");
    setItem(updated);

    const project = await getProject(item.projectId);
    if (!project || !currentUser) return;
    const notifyUserId =
      currentUser.role === "client" ? project.adminId : item.createdBy;
    if (notifyUserId !== currentUser.id) {
      await addNotification(
        notifyUserId,
        "status_change",
        item.id,
        "Goedkeuring is ongedaan gemaakt",
      );
    }
  };

  const handleAdminStartWork = async () => {
    if (!item || item.type !== "bug" || currentUser?.role !== "admin") return;
    if (item.status !== "open") return;
    const updated = await updateStatus(item.id, "in_progress");
    setItem(updated);
    if (item.createdBy !== currentUser.id) {
      await addNotification(
        item.createdBy,
        "status_change",
        item.id,
        "Developer werkt aan je bug",
      );
    }
  };

  const handleAdminReadyForReview = async () => {
    if (!item || item.type !== "bug" || currentUser?.role !== "admin") return;
    if (item.status !== "in_progress") return;
    const updated = await updateStatus(item.id, "in_review");
    setItem(updated);
    if (item.createdBy !== currentUser.id) {
      await addNotification(
        item.createdBy,
        "status_change",
        item.id,
        "Bug klaar voor review — controleer of het is opgelost",
      );
    }
  };

  const handleFeatureApprove = async () => {
    if (!item || item.type !== "feature") return;
    const updated = await updateStatus(item.id, "approved");
    setItem(updated);
    await notifyCreator("Je feature-aanvraag is goedgekeurd");
  };

  const handleFeatureStart = async () => {
    if (!item || item.type !== "feature") return;
    const updated = await updateStatus(item.id, "in_progress");
    setItem(updated);
    await notifyCreator("Ontwikkeling van je feature is gestart");
  };

  const handleFeatureDeliver = () => {
    if (!item || item.type !== "feature" || item.status !== "in_progress") return;
    navigate(
      `/projects/${item.projectId}/viewer?deliverFeature=${item.id}${item.pageUrl ? `&url=${encodeURIComponent(item.pageUrl)}` : ""}`,
    );
  };

  const handleFeatureAccept = async (accepted: boolean) => {
    if (!item || item.type !== "feature" || item.status !== "delivered") return;
    if (currentUser?.role !== "client") return;
    const status: ItemStatus = accepted ? "accepted" : "in_progress";
    const updated = await updateStatus(item.id, status);
    setItem(updated);

    const project = await getProject(item.projectId);
    if (!project || !currentUser) return;

    if (currentUser.role === "client") {
      await addNotification(
        project.adminId,
        "status_change",
        item.id,
        accepted
          ? "Klant heeft feature geaccepteerd"
          : "Klant heeft feature afgewezen",
      );
    }
  };

  const handleFeatureUndoAccept = async () => {
    if (!item || item.type !== "feature" || item.status !== "accepted") return;
    const updated = await updateStatus(item.id, "delivered");
    setItem(updated);
  };

  const handleAddComment = async () => {
    if (!item || !currentUser || !newComment.trim()) return;
    await addComment(item.id, currentUser.id, newComment);
    setNewComment("");
    load();

    if (item.createdBy !== currentUser.id) {
      await addNotification(
        item.createdBy,
        "new_comment",
        item.id,
        "Nieuwe reactie op feedback",
      );
    }
  };

  if (!item) {
    return <p className="text-muted-foreground">Feedback laden...</p>;
  }

  const isBug = item.type === "bug";
  const primaryLabel = isBug
    ? "Wat gaat er mis?"
    : "Wat wordt er gebouwd?";
  const secondaryLabel = isBug
    ? "Hoe hoort het te werken?"
    : "Acceptatiecriteria";

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <Link
        to={`/projects/${item.projectId}/feedback`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Terug naar bord
      </Link>

      <div className="space-y-5 rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge item={item} />
          <FeedbackTypeBadge type={item.type} />
          <DeviceTypeBadge deviceType={item.deviceType} />
          {item.hasLocation && item.pageUrl && (
            <span className="text-xs text-muted-foreground">
              {item.pageUrl}
              {item.cssSelector ? ` — ${item.cssSelector}` : ""}
            </span>
          )}
          {!item.hasLocation && (
            <span className="text-xs text-muted-foreground">Geen locatie</span>
          )}
        </div>

        <div>
          <h2 className="mb-1 text-sm font-medium text-muted-foreground">
            {primaryLabel}
          </h2>
          <p className="text-base sm:text-lg">{item.problemDescription}</p>
        </div>

        <div>
          <h2 className="mb-1 text-sm font-medium text-muted-foreground">
            {secondaryLabel}
          </h2>
          <p className="text-base">{item.definitionOfDone}</p>
        </div>

        {item.type === "feature" && item.deliveryDescription && (
          <div>
            <h2 className="mb-1 text-sm font-medium text-muted-foreground">
              Wat is hier gebouwd?
            </h2>
            <p className="text-base">{item.deliveryDescription}</p>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Aangemaakt op {formatDate(item.createdAt)} door{" "}
          {MOCK_USERS.find((u) => u.id === item.createdBy)?.name ?? "Onbekend"}
        </p>

        {item.hasLocation && item.x != null && item.y != null && (
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              Locatie op pagina
            </h2>
            <FeedbackScreenshot item={item} />
            <p className="text-xs text-muted-foreground">
              Marker op ({Math.round(item.x)}, {Math.round(item.y)})
              {item.cssSelector ? ` — ${item.cssSelector}` : ""}
            </p>
            {item.pageUrl && (
              <Link
                to={`/projects/${item.projectId}/viewer?url=${encodeURIComponent(item.pageUrl)}`}
                className="text-xs font-medium text-primary hover:underline"
              >
                Bekijk in viewer →
              </Link>
            )}
          </div>
        )}

        <FeedbackItemActions
          item={item}
          isAdmin={currentUser?.role === "admin"}
          isClient={currentUser?.role === "client"}
          onStatusChange={handleStatusChange}
          onAdminStartWork={handleAdminStartWork}
          onAdminReadyForReview={handleAdminReadyForReview}
          onApproval={handleBugApproval}
          onUndoApproval={handleBugUndoApproval}
          onFeatureApprove={handleFeatureApprove}
          onFeatureStart={handleFeatureStart}
          onFeatureDeliver={handleFeatureDeliver}
          onFeatureAccept={handleFeatureAccept}
          onFeatureConvertToBug={
            item.type === "feature" &&
            item.status === "delivered" &&
            currentUser?.role === "client"
              ? () =>
                  navigate(
                    `/projects/${item.projectId}/viewer?convertFeature=${item.id}${item.pageUrl ? `&url=${encodeURIComponent(item.pageUrl)}` : ""}`,
                  )
              : undefined
          }
          onFeatureUndoAccept={handleFeatureUndoAccept}
        />
      </div>

      <div className="space-y-4 rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">Reacties</h2>
        <CommentThread comments={comments} />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Schrijf een reactie..."
            rows={2}
            className="flex-1 text-base sm:text-sm"
          />
          <Button
            className="w-full shrink-0 sm:w-auto sm:self-end"
            disabled={!newComment.trim()}
            onClick={handleAddComment}
          >
            <Send className="h-4 w-4" />
            Verstuur
          </Button>
        </div>
      </div>
    </div>
  );
}
