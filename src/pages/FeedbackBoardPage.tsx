import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KanbanColumn } from "@/components/feedback/KanbanColumn";
import { useAuthStore } from "@/store/useAuthStore";
import { useFeedbackStore } from "@/store/useFeedbackStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useProjectStore } from "@/store/useProjectStore";
import type { FeedbackItem, FeedbackStatus, Project } from "@/types";
import { BOARD_STATUSES, FEEDBACK_STATUS_LABELS } from "@/types";

export function FeedbackBoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { fetchFeedback, updateStatus, deleteFeedback } = useFeedbackStore();
  const { getProject, getProjectsForUser } = useProjectStore();
  const { addNotification } = useNotificationStore();

  const [project, setProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<FeedbackStatus | null>(
    null,
  );

  const loadItems = useCallback(async () => {
    if (!projectId) return;
    const result = await fetchFeedback(projectId);
    setItems(result);
  }, [projectId, fetchFeedback]);

  useEffect(() => {
    if (!projectId || !currentUser) return;
    getProject(projectId).then((p) => setProject(p ?? null));
    getProjectsForUser(currentUser.id, currentUser.role).then(setProjects);
    loadItems();
  }, [projectId, currentUser, getProject, getProjectsForUser, loadItems]);

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData("text/plain", itemId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(itemId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, newStatus: FeedbackStatus) => {
    e.preventDefault();
    if (currentUser?.role !== "admin") return;
    setDragOverColumn(null);
    setDraggingId(null);

    const itemId = e.dataTransfer.getData("text/plain");
    const item = items.find((i) => i.id === itemId);
    if (!item || item.status === newStatus) return;

    const updated = await updateStatus(itemId, newStatus);
    setItems((prev) => prev.map((i) => (i.id === itemId ? updated : i)));

    if (currentUser && item.createdBy !== currentUser.id) {
      await addNotification(
        item.createdBy,
        "status_change",
        item.id,
        `Status gewijzigd naar "${FEEDBACK_STATUS_LABELS[newStatus]}"`,
      );
    }
  };

  const handleDelete = async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item || item.status !== "done") return;

    if (
      !window.confirm(
        "Weet je zeker dat je dit feedback-item wilt verwijderen?",
      )
    ) {
      return;
    }

    await deleteFeedback(itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const itemsByStatus = (status: FeedbackStatus) =>
    items.filter((i) => i.status === status);

  const isAdmin = currentUser?.role === "admin";

  if (!project) {
    return <p className="text-sm text-muted-foreground">Project laden...</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Feedback — ${project.name}`}
        description={
          isAdmin
            ? `${items.length} item${items.length !== 1 ? "s" : ""} — sleep kaarten tussen kolommen`
            : `${items.length} item${items.length !== 1 ? "s" : ""} — open een kaart om details te bekijken`
        }
      >
        <Link to="/feedback">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        {projects.length > 1 && (
          <Select
            value={projectId}
            onValueChange={(id) => navigate(`/projects/${id}/feedback`)}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </PageHeader>

      <div
        className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2"
        onDragEnd={handleDragEnd}
      >
        {BOARD_STATUSES.map((status) => (
          <div
            key={status}
            onDragEnter={() => setDragOverColumn(status)}
            onDragLeave={() => setDragOverColumn(null)}
          >
            <KanbanColumn
              status={status}
              items={itemsByStatus(status)}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDelete={handleDelete}
              canDrag={isAdmin}
              isDragOver={dragOverColumn === status && draggingId !== null}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
