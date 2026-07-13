import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store/useAuthStore";
import { useProjectStore } from "@/store/useProjectStore";
import { useFeedbackStore } from "@/store/useFeedbackStore";
import type { Project } from "@/types";

export function ProjectsPage() {
  const { currentUser } = useAuthStore();
  const { getProjectsForUser, createProject } = useProjectStore();
  const { getCountsByProject } = useFeedbackStore();
  const [projects, setProjects] = useState<
    (Project & { openCount: number })[]
  >([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", targetUrl: "", description: "" });

  const loadProjects = async () => {
    if (!currentUser) return;
    const projs = await getProjectsForUser(currentUser.id, currentUser.role);
    const withCounts = await Promise.all(
      projs.map(async (p) => {
        const counts = await getCountsByProject(p.id);
        return { ...p, openCount: counts.open };
      }),
    );
    setProjects(withCounts);
  };

  useEffect(() => {
    loadProjects();
  }, [currentUser]);

  const handleCreate = async () => {
    if (!currentUser || !form.name) return;
    await createProject(form, currentUser.id);
    setForm({ name: "", targetUrl: "", description: "" });
    setDialogOpen(false);
    loadProjects();
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Projecten"
        description="Beheer je feedback-projecten"
      >
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Nieuw project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nieuw project</DialogTitle>
              <DialogDescription>
                Maak een nieuw project aan voor feedback op een website.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Projectnaam</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Bijv. Bakkerij Van Dijk"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">Doel-URL</Label>
                <Input
                  id="url"
                  value={form.targetUrl}
                  onChange={(e) =>
                    setForm({ ...form, targetUrl: e.target.value })
                  }
                  placeholder="https://voorbeeld.nl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Omschrijving</Label>
                <Textarea
                  id="desc"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Korte omschrijving van het project..."
                />
              </div>
              <Button className="w-full" onClick={handleCreate}>
                Project aanmaken
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle>{project.name}</CardTitle>
              <CardDescription className="flex items-center gap-1.5">
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="truncate">{project.targetUrl}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                {project.description}
              </p>
              <div className="flex items-center justify-between border-t border-border/60 pt-4">
                <Badge variant="open">{project.openCount} open</Badge>
                <Link to={`/projects/${project.id}`}>
                  <Button variant="outline" size="sm">
                    Openen
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
