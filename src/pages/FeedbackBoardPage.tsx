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
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useAuthStore } from "@/store/useAuthStore";
import { useFeedbackStore } from "@/store/useFeedbackStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useProjectStore } from "@/store/useProjectStore";
import type {
  BugStatus,
  FeatureStatus,
  FeedbackItem,
  FeedbackType,
  ItemStatus,
  Project,
} from "@/types";
import {
  BOARD_STATUSES,
  FEATURE_BOARD_STATUSES,
  getStatusLabel,
} from "@/types";

type BoardTab = "bugs" | "features" | "all";

export function FeedbackBoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { fetchFeedback, updateStatus, deleteFeedback } =
    useFeedbackStore();
  const { getProject, getProjectsForUser } = useProjectStore();
  const { addNotification } = useNotificationStore();

  const [project, setProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [activeTab, setActiveTab] = useState<BoardTab>("bugs");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ItemStatus | null>(null);

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

  const handleDrop = async (e: React.DragEvent, newStatus: ItemStatus) => {
    e.preventDefault();
    if (currentUser?.role !== "admin") return;
    setDragOverColumn(null);
    setDraggingId(null);

    const itemId = e.dataTransfer.getData("text/plain");
    const item = items.find((i) => i.id === itemId);
    if (!item || item.status === newStatus) return;

    const updated = await updateStatus(itemId, newStatus);
    setItems((prev) => prev.map((i) => (i.id === itemId ? updated : i)));

    if (item.createdBy !== currentUser.id) {
      let message = `Status gewijzigd naar "${getStatusLabel(newStatus, item.type)}"`;

      if (item.type === "bug") {
        if (newStatus === "in_progress") {
          message = "Developer werkt aan je bug";
        } else if (newStatus === "in_review") {
          message = "Bug klaar voor review — controleer of het is opgelost";
        }
      } else if (item.type === "feature") {
        if (newStatus === "in_progress") {
          message = "Developer werkt aan je feature";
        } else if (newStatus === "delivered") {
          message = "Feature opgeleverd — controleer of het naar wens is";
        }
      }

      await addNotification(
        item.createdBy,
        "status_change",
        item.id,
        message,
      );
    }
  };

  const handleDelete = async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const canDelete =
      item.type === "bug"
        ? item.status === "done"
        : item.status === "accepted";
    if (!canDelete) return;

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

  const bugs = items.filter((i) => i.type === "bug");
  const features = items.filter((i) => i.type === "feature");
  const itemsByStatus = (type: FeedbackType, status: ItemStatus) =>
    items.filter((i) => i.type === type && i.status === status);

  const isAdmin = currentUser?.role === "admin";

  const renderBoard = (type: FeedbackType, statuses: ItemStatus[]) => (
    <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-2 scrollbar-thin sm:-mx-1 sm:gap-4 sm:px-1">
      {statuses.map((status) => (
        <div
          key={status}
          onDragEnter={() => setDragOverColumn(status)}
          onDragLeave={() => setDragOverColumn(null)}
        >
          <KanbanColumn
            status={status}
            itemType={type}
            items={itemsByStatus(type, status)}
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
  );

  if (!project) {
    return <p className="text-sm text-muted-foreground">Project laden...</p>;
  }

  const tabCounts = {
    bugs: bugs.length,
    features: features.length,
    all: items.length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feedback"
        description={
          isAdmin
            ? `${items.length} item${items.length !== 1 ? "s" : ""} — sleep kaarten tussen kolommen`
            : `${items.length} item${items.length !== 1 ? "s" : ""} — open een kaart om details te bekijken`
        }
      >
        <Link to={`/projects/${projectId}/viewer`}>
          <Button variant="outline" size="icon" aria-label="Terug naar viewer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        {projects.length > 1 && (
          <Select
            value={projectId}
            onValueChange={(id) => navigate(`/projects/${id}/feedback`)}
          >
            <SelectTrigger className="w-full sm:w-56">
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

      <p className="-mt-2 text-sm font-medium text-muted-foreground sm:hidden">
        {project.name}
      </p>

      <SegmentedControl
        value={activeTab}
        onChange={setActiveTab}
        options={[
          { value: "bugs", label: "Bugs", count: tabCounts.bugs },
          { value: "features", label: "Features", count: tabCounts.features },
          { value: "all", label: "Alles", count: tabCounts.all },
        ]}
      />

      <div onDragEnd={handleDragEnd}>
        {activeTab === "bugs" &&
          renderBoard("bug", BOARD_STATUSES as BugStatus[])}
        {activeTab === "features" &&
          renderBoard("feature", FEATURE_BOARD_STATUSES as FeatureStatus[])}
        {activeTab === "all" && (
          <div className="space-y-8">
            <section>
              <h2 className="mb-4 text-sm font-semibold text-muted-foreground">
                Bugs ({bugs.length})
              </h2>
              {renderBoard("bug", BOARD_STATUSES as BugStatus[])}
            </section>
            <section>
              <h2 className="mb-4 text-sm font-semibold text-muted-foreground">
                Features ({features.length})
              </h2>
              {renderBoard("feature", FEATURE_BOARD_STATUSES as FeatureStatus[])}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
