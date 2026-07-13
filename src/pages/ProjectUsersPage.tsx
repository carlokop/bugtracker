import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { KeyRound, Pencil, Trash2, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/useAuthStore";
import { useProjectStore } from "@/store/useProjectStore";
import type { Project, User } from "@/types";

export function ProjectUsersPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentUser } = useAuthStore();
  const {
    getProject,
    getProjectMembers,
    createClientUser,
    updateClientUser,
    removeClient,
  } = useProjectStore();

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    name: "",
  });

  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    email: "",
    password: "",
    name: "",
  });

  const load = async () => {
    if (!projectId) return;
    const p = await getProject(projectId);
    setProject(p ?? null);
    const m = await getProjectMembers(projectId);
    setMembers(m);
  };

  useEffect(() => {
    load();
  }, [projectId]);

  if (currentUser?.role !== "admin") {
    return (
      <p className="text-sm text-muted-foreground">
        Alleen admins hebben toegang tot deze pagina.
      </p>
    );
  }

  const handleCreate = async () => {
    if (!projectId || !createForm.email || !createForm.password) return;
    setSaving(true);
    setError(null);
    try {
      await createClientUser(projectId, {
        email: createForm.email,
        password: createForm.password,
        name: createForm.name || undefined,
      });
      setCreateForm({ email: "", password: "", name: "" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Er ging iets mis");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    setEditForm({
      email: user.email,
      password: "",
      name: user.name,
    });
    setError(null);
  };

  const handleUpdate = async () => {
    if (!editUser) return;
    setSaving(true);
    setError(null);
    try {
      await updateClientUser(editUser.id, {
        email: editForm.email,
        name: editForm.name,
        ...(editForm.password ? { password: editForm.password } : {}),
      });
      setEditUser(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Er ging iets mis");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!projectId) return;
    await removeClient(projectId, userId);
    load();
  };

  if (!project) {
    return <p className="text-sm text-muted-foreground">Project laden...</p>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gebruikers"
        description={`Klantaccounts voor ${project.name}`}
      >
        <Link to={`/projects/${project.id}/viewer`}>
          <Button variant="outline">Terug naar viewer</Button>
        </Link>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Klantaccount aanmaken
          </CardTitle>
          <CardDescription>
            Maak een account aan met e-mail en wachtwoord. De klant krijgt
            toegang tot dit project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && !editUser && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="create-email">E-mailadres</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm({ ...createForm, email: e.target.value })
                }
                placeholder="klant@voorbeeld.nl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-name">Naam (optioneel)</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm({ ...createForm, name: e.target.value })
                }
                placeholder="Jan de Vries"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="create-password">Wachtwoord</Label>
              <Input
                id="create-password"
                type="password"
                value={createForm.password}
                onChange={(e) =>
                  setCreateForm({ ...createForm, password: e.target.value })
                }
                placeholder="Minimaal 6 tekens"
              />
            </div>
          </div>
          <Button
            onClick={handleCreate}
            disabled={
              saving || !createForm.email || createForm.password.length < 6
            }
          >
            Account aanmaken
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Gekoppelde klanten
          </CardTitle>
          <CardDescription>
            Klanten met toegang tot dit project
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nog geen klanten gekoppeld aan dit project
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.email}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(member)}
                      aria-label="Bewerken"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(member.id)}
                      aria-label="Verwijderen"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(editUser)} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Klantaccount bewerken</DialogTitle>
            <DialogDescription>
              Wijzig e-mail, naam of wachtwoord. Laat wachtwoord leeg om het
              huidige wachtwoord te behouden.
            </DialogDescription>
          </DialogHeader>
          {error && editUser && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">E-mailadres</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Naam</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Nieuw wachtwoord</Label>
              <Input
                id="edit-password"
                type="password"
                value={editForm.password}
                onChange={(e) =>
                  setEditForm({ ...editForm, password: e.target.value })
                }
                placeholder="Laat leeg om niet te wijzigen"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleUpdate}
              disabled={
                saving ||
                !editForm.email ||
                (editForm.password.length > 0 && editForm.password.length < 6)
              }
            >
              Opslaan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
