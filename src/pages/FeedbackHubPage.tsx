import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
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
import type { Project } from "@/types";

export function FeedbackHubPage() {
  const { currentUser } = useAuthStore();
  const { getProjectsForUser } = useProjectStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    getProjectsForUser(currentUser.id, currentUser.role).then((projs) => {
      setProjects(projs);
      setLoading(false);
    });
  }, [currentUser, getProjectsForUser]);

  if (!currentUser) return null;

  if (loading) {
    return <p className="text-sm text-muted-foreground">Laden...</p>;
  }

  if (projects.length === 1) {
    return <Navigate to={`/projects/${projects[0].id}/feedback`} replace />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Feedback overzicht"
        description="Kies een project om het feedbackbord te openen"
      />

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Geen projecten gevonden
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}/feedback`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Open feedbackbord <ArrowRight className="h-3 w-3" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
