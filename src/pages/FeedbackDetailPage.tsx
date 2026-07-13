import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Bug, Send } from "lucide-react";
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
import type { FeedbackComment, FeedbackItem, FeedbackStatus, FeedbackType } from "@/types";
import { FEEDBACK_STATUS_LABELS, FEEDBACK_TYPE_LABELS } from "@/types";

export function FeedbackDetailPage() {
  const { feedbackId } = useParams<{ feedbackId: string }>();
  const { currentUser } = useAuthStore();
  const { getFeedbackItem, updateStatus, updateType, addComment, getComments } =
    useFeedbackStore();
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

  const handleStatusChange = async (status: FeedbackStatus) => {
    if (!item || !currentUser || currentUser.role !== "admin") return;
    if (item.status === status) return;
    const updated = await updateStatus(item.id, status);
    setItem(updated);

    const creator = MOCK_USERS.find((u) => u.id === item.createdBy);
    if (creator && creator.id !== currentUser.id) {
      await addNotification(
        creator.id,
        "status_change",
        item.id,
        `Status gewijzigd naar "${FEEDBACK_STATUS_LABELS[status]}"`,
      );
    }

    if (status === "done" && currentUser.role === "admin") {
      const project = await getProject(item.projectId);
      if (project && item.createdBy !== project.adminId) {
        await addNotification(
          item.createdBy,
          "status_change",
          item.id,
          "Je feedback is goedgekeurd en gemarkeerd als gedaan",
        );
      }
    }
  };

  const handleApproval = async (approved: boolean) => {
    if (!item || !currentUser || item.status !== "in_review") return;

    const status: FeedbackStatus = approved ? "done" : "in_progress";
    const updated = await updateStatus(item.id, status);
    setItem(updated);

    const project = await getProject(item.projectId);
    if (!project) return;

    if (currentUser.role === "client") {
      await addNotification(
        project.adminId,
        "status_change",
        item.id,
        approved
          ? "Klant heeft feedback goedgekeurd"
          : "Klant heeft feedback afgekeurd",
      );
    } else {
      if (item.createdBy !== currentUser.id) {
        await addNotification(
          item.createdBy,
          "status_change",
          item.id,
          approved
            ? "Je feedback is goedgekeurd en gemarkeerd als gedaan"
            : "Je feedback is afgekeurd en teruggezet naar in behandeling",
        );
      }
    }
  };

  const handleUndoApproval = async () => {
    if (!item || !currentUser || item.status !== "done") return;

    if (
      !window.confirm(
        "Weet je zeker dat je de goedkeuring ongedaan wilt maken? Het item gaat terug naar ter goedkeuring.",
      )
    ) {
      return;
    }

    const updated = await updateStatus(item.id, "in_review");
    setItem(updated);

    const project = await getProject(item.projectId);
    if (!project) return;

    const notifyUserId =
      currentUser.role === "client" ? project.adminId : item.createdBy;

    if (notifyUserId !== currentUser.id) {
      await addNotification(
        notifyUserId,
        "status_change",
        item.id,
        "Goedkeuring is ongedaan gemaakt — opnieuw ter goedkeuring",
      );
    }
  };

  const handleClientMarkDone = async () => {
    if (!item || !currentUser || currentUser.role !== "client") return;
    if (item.status !== "in_progress") return;

    const updated = await updateStatus(item.id, "in_review");
    setItem(updated);

    const project = await getProject(item.projectId);
    if (project) {
      await addNotification(
        project.adminId,
        "status_change",
        item.id,
        "Klant heeft aangegeven dat feedback gedaan is — goedkeuring vereist",
      );
    }
  };

  const handleTypeChange = async (type: FeedbackType) => {
    if (!item || item.type === type) return;
    const updated = await updateType(item.id, type);
    setItem(updated);
  };

  const handleAddComment = async () => {
    if (!item || !currentUser || !newComment.trim()) return;
    await addComment(item.id, currentUser.id, newComment);
    setNewComment("");
    load();

    const otherUsers = [item.createdBy].filter(
      (id) => id !== currentUser.id,
    );
    for (const userId of otherUsers) {
      await addNotification(
        userId,
        "new_comment",
        item.id,
        "Nieuwe reactie op feedback",
      );
    }
  };

  if (!item) {
    return <p className="text-muted-foreground">Feedback laden...</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to={`/projects/${item.projectId}/feedback`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Terug naar bord
      </Link>

      <div className="space-y-5 rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={item.status} />
          <FeedbackTypeBadge type={item.type} />
          <DeviceTypeBadge deviceType={item.deviceType} />
          <span className="text-xs text-muted-foreground">
            {item.pageUrl} — {item.cssSelector}
          </span>
        </div>

        <div>
          <h2 className="mb-1 text-sm font-medium text-muted-foreground">
            Probleem
          </h2>
          <p className="text-lg">{item.problemDescription}</p>
        </div>

        <div>
          <h2 className="mb-1 text-sm font-medium text-muted-foreground">
            Definition of done
          </h2>
          <p className="text-base">{item.definitionOfDone}</p>
        </div>

        <p className="text-xs text-muted-foreground">
          Aangemaakt op {formatDate(item.createdAt)} door{" "}
          {MOCK_USERS.find((u) => u.id === item.createdBy)?.name ?? "Onbekend"}
        </p>

        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Locatie op pagina
          </h2>
          <FeedbackScreenshot item={item} />
          <p className="text-xs text-muted-foreground">
            Marker op ({Math.round(item.x)}, {Math.round(item.y)}) —{" "}
            {item.cssSelector}
          </p>
        </div>

        {currentUser && item.type === "feature" && (
          <div className="space-y-3 border-t border-border/60 pt-4">
            <h3 className="text-sm font-medium">Omzetten naar bug</h3>
            <p className="text-sm text-muted-foreground">
              Is deze feature niet goed uitgevoerd? Zet het om naar een bug door
              de foutlocatie op de pagina aan te geven.
            </p>
            <Link
              to={`/projects/${item.projectId}/viewer?url=${encodeURIComponent(item.pageUrl)}&convertFrom=${item.id}`}
            >
              <Button size="sm" variant="outline">
                <Bug className="h-4 w-4" />
                Omzetten naar bug
              </Button>
            </Link>
          </div>
        )}

        {currentUser && item.type === "bug" && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
            <span className="text-xs font-medium text-muted-foreground">Type:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTypeChange("feature")}
            >
              {FEEDBACK_TYPE_LABELS.feature}
            </Button>
          </div>
        )}

        <FeedbackItemActions
          item={item}
          isAdmin={currentUser?.role === "admin"}
          isClient={currentUser?.role === "client"}
          onStatusChange={handleStatusChange}
          onClientMarkDone={handleClientMarkDone}
          onApproval={handleApproval}
          onUndoApproval={handleUndoApproval}
        />
      </div>

      <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Reacties</h2>
        <CommentThread comments={comments} />
        <div className="flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Schrijf een reactie..."
            rows={2}
            className="flex-1"
          />
          <Button
            size="icon"
            className="shrink-0 self-end"
            disabled={!newComment.trim()}
            onClick={handleAddComment}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
