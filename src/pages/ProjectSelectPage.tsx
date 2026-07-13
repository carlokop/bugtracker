import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, FolderKanban, Globe, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useProjectContextStore } from "@/store/useProjectContextStore";
import type { Project } from "@/types";

export function ProjectSelectPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { getProjectsForUser, createProject } = useProjectStore();
  const { selectProject, clearProject } = useProjectContextStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", targetUrl: "", description: "" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    clearProject();
    getProjectsForUser(currentUser.id, currentUser.role).then((projs) => {
      setProjects(projs);
      setLoading(false);
      if (projs.length === 1 && currentUser.role !== "admin") {
        selectProject(projs[0].id);
        navigate(`/projects/${projs[0].id}/viewer`, { replace: true });
      }
    });
  }, [currentUser, getProjectsForUser, navigate, selectProject, clearProject]);

  const handleSelect = (projectId: string) => {
    selectProject(projectId);
    navigate(`/projects/${projectId}/viewer`);
  };

  const handleCreate = async () => {
    if (!currentUser || !form.name.trim() || !form.targetUrl.trim()) {
      setError("Vul projectnaam en doel-URL in.");
      return;
    }
    setError(null);
    try {
      const project = await createProject(
        {
          name: form.name.trim(),
          targetUrl: form.targetUrl.trim(),
          description: form.description.trim(),
        },
        currentUser.id,
      );
      setForm({ name: "", targetUrl: "", description: "" });
      setDialogOpen(false);
      selectProject(project.id);
      navigate(`/projects/${project.id}/users?welcome=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Project aanmaken mislukt");
    }
  };

  if (!currentUser) return null;

  const isAdmin = currentUser.role === "admin";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Projecten laden...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title={isAdmin ? "Jouw projecten" : "Kies een project"}
        description={
          isAdmin
            ? "Maak een project aan, voeg klanten toe en beheer feedback per project"
            : "Selecteer het project waaraan je wilt werken"
        }
      >
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
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
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="Bijv. Bakkerij Van Dijk"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">Doel-URL *</Label>
                  <Input
                    id="url"
                    type="url"
                    inputMode="url"
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
                {error && (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}
                <Button
                  className="w-full"
                  onClick={handleCreate}
                  disabled={!form.name.trim() || !form.targetUrl.trim()}
                >
                  Project aanmaken
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      {isAdmin && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4 text-sm leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">Developer-workflow</p>
            <ol className="mt-2 list-inside list-decimal space-y-1">
              <li>Maak een project aan (website van de klant)</li>
              <li>Voeg klantaccounts toe onder Gebruikers</li>
              <li>Verzamel en beheer feedback binnen dat project</li>
            </ol>
          </CardContent>
        </Card>
      )}

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <FolderKanban className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {isAdmin
                ? "Je hebt nog geen projecten. Maak er een aan om te beginnen."
                : "Je hebt nog geen toegang tot projecten. Neem contact op met je developer."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="group cursor-pointer border-border/80 transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.99]"
              onClick={() => handleSelect(project.id)}
            >
              <CardHeader className="pb-3">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <CardTitle className="text-base sm:text-lg">
                  {project.name}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.targetUrl && (
                  <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    <Globe className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{project.targetUrl}</span>
                  </p>
                )}
                <Button
                  variant="outline"
                  className="w-full gap-2 group-hover:border-primary/30 group-hover:bg-primary/5"
                >
                  Openen
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
