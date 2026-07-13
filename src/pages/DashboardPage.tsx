import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, Clock, FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/store/useAuthStore";
import { useProjectStore } from "@/store/useProjectStore";
import { useFeedbackStore } from "@/store/useFeedbackStore";
import type { FeedbackStatus, Project } from "@/types";

interface ProjectWithCounts extends Project {
  counts: Record<FeedbackStatus, number>;
}

export function DashboardPage() {
  const { currentUser } = useAuthStore();
  const { getProjectsForUser } = useProjectStore();
  const { getCountsByProject } = useFeedbackStore();
  const [projects, setProjects] = useState<ProjectWithCounts[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      const projs = await getProjectsForUser(currentUser.id, currentUser.role);
      const withCounts = await Promise.all(
        projs.map(async (p) => ({
          ...p,
          counts: await getCountsByProject(p.id),
        })),
      );
      setProjects(withCounts);
      setLoading(false);
    })();
  }, [currentUser, getProjectsForUser, getCountsByProject]);

  if (!currentUser) return null;

  const isAdmin = currentUser.role === "admin";
  const totalOpen = projects.reduce((sum, p) => sum + p.counts.open, 0);
  const totalDone = projects.reduce((sum, p) => sum + p.counts.done, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title={isAdmin ? "Dashboard" : "Mijn projecten"}
        description={`Welkom terug, ${currentUser.name}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Projecten
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">
              {projects.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open feedback
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">
              {totalOpen}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Afgerond
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">
              {totalDone}
            </div>
          </CardContent>
        </Card>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">
          {isAdmin ? "Alle projecten" : "Jouw projecten"}
        </h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Laden...</p>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Geen projecten gevonden
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="transition-shadow hover:shadow-md"
              >
                <CardHeader>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex flex-wrap gap-2">
                    <Badge variant="open">{project.counts.open} open</Badge>
                    <Badge variant="progress">
                      {project.counts.in_progress} in behandeling
                    </Badge>
                    <Badge variant="review">
                      {project.counts.in_review} in review
                    </Badge>
                    <Badge variant="done">{project.counts.done} gedaan</Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 border-t border-border/60 pt-4">
                    <Link
                      to={`/projects/${project.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      Viewer <ArrowRight className="h-3 w-3" />
                    </Link>
                    <Link
                      to={`/projects/${project.id}/feedback`}
                      className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Feedbackbord
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
