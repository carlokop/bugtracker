import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bug, CheckCircle, FolderOpen, Sparkles } from "lucide-react";
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
import type { Project, ProjectFeedbackCounts } from "@/types";

interface ProjectWithCounts extends Project {
  counts: ProjectFeedbackCounts;
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
  const totalOpenBugs = projects.reduce(
    (sum, p) => sum + p.counts.bugs.open,
    0,
  );
  const totalDeliveredFeatures = projects.reduce(
    (sum, p) => sum + p.counts.features.delivered,
    0,
  );
  const totalDoneBugs = projects.reduce(
    (sum, p) => sum + p.counts.bugs.done,
    0,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title={isAdmin ? "Dashboard" : "Mijn projecten"}
        description={`Welkom terug, ${currentUser.name}`}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 sm:p-6">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
              Projecten
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {projects.length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 sm:p-6">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
              Open bugs
            </CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {totalOpenBugs}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 sm:p-6">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
              Features te beoordelen
            </CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {totalDeliveredFeatures}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 sm:p-6">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
              Bugs opgelost
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {totalDoneBugs}
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
                  <div className="mb-2 text-xs font-medium text-muted-foreground">
                    Bugs
                  </div>
                  <div className="mb-4 flex flex-wrap gap-2">
                    <Badge variant="open">
                      {project.counts.bugs.open} open
                    </Badge>
                    <Badge variant="progress">
                      {project.counts.bugs.in_progress} in behandeling
                    </Badge>
                    <Badge variant="review">
                      {project.counts.bugs.in_review} ter goedkeuring
                    </Badge>
                    <Badge variant="done">
                      {project.counts.bugs.done} gedaan
                    </Badge>
                  </div>
                  <div className="mb-2 text-xs font-medium text-muted-foreground">
                    Features
                  </div>
                  <div className="mb-4 flex flex-wrap gap-2">
                    <Badge variant="open">
                      {project.counts.features.requested} aangevraagd
                    </Badge>
                    <Badge variant="progress">
                      {project.counts.features.in_progress} in ontwikkeling
                    </Badge>
                    <Badge variant="review">
                      {project.counts.features.delivered} opgeleverd
                    </Badge>
                    <Badge variant="done">
                      {project.counts.features.accepted} geaccepteerd
                    </Badge>
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
