import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { KeyRound, Lock, Pencil, Trash2, UserPlus } from "lucide-react";
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
import { MIN_PASSWORD_LENGTH, isPasswordLongEnough } from "@/lib/password";
import type { Project, User } from "@/types";

export function ProjectUsersPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const showWelcome = searchParams.get("welcome") === "1";
  const { currentUser } = useAuthStore();
  const {
    getProject,
    getProjectMembers,
    updateProject,
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

  const [proxyAuth, setProxyAuth] = useState({
    user: "",
    password: "",
  });
  const [proxySaving, setProxySaving] = useState(false);
  const [proxyMessage, setProxyMessage] = useState<string | null>(null);

  const load = async () => {
    if (!projectId) return;
    const p = await getProject(projectId);
    setProject(p ?? null);
    if (p) {
      setProxyAuth({
        user: p.proxyAuthUser ?? "",
        password: "",
      });
    }
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
      await updateClientUser(projectId!, editUser.id, {
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

  const handleSaveProxyAuth = async () => {
    if (!projectId) return;
    setProxySaving(true);
    setProxyMessage(null);
    try {
      await updateProject(projectId, {
        proxyAuthUser: proxyAuth.user.trim() || null,
        ...(proxyAuth.password
          ? { proxyAuthPassword: proxyAuth.password }
          : {}),
      });
      setProxyAuth((prev) => ({ ...prev, password: "" }));
      setProxyMessage("Staging-toegang opgeslagen");
      await load();
    } catch (e) {
      setProxyMessage(e instanceof Error ? e.message : "Opslaan mislukt");
    } finally {
      setProxySaving(false);
    }
  };

  const handleClearProxyAuth = async () => {
    if (!projectId) return;
    setProxySaving(true);
    setProxyMessage(null);
    try {
      await updateProject(projectId, {
        proxyAuthUser: null,
        proxyAuthPassword: null,
      });
      setProxyAuth({ user: "", password: "" });
      setProxyMessage("Staging-toegang verwijderd");
      await load();
    } catch (e) {
      setProxyMessage(e instanceof Error ? e.message : "Verwijderen mislukt");
    } finally {
      setProxySaving(false);
    }
  };

  if (!project) {
    return <p className="text-sm text-muted-foreground">Project laden...</p>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gebruikers"
        description={`Klantaccounts voor ${project.name} — zij zien alleen feedback van dit project`}
      >
        <Link to={`/projects/${project.id}/viewer`}>
          <Button variant="outline">Terug naar viewer</Button>
        </Link>
      </PageHeader>

      {showWelcome && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Project aangemaakt. Voeg nu een of meer klantaccounts toe — zij
              kunnen daarna inloggen en feedback geven binnen dit project.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchParams({})}
            >
              Sluiten
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Staging-toegang (HTTP Basic Auth)
          </CardTitle>
          <CardDescription>
            Voor wachtwoord-beveiligde staging-omgevingen zoals{" "}
            <code className="text-xs">staging.*</code>. De proxy gebruikt deze
            gegevens om de site in de viewer te laden.
            {project.hasProxyAuth && (
              <span className="mt-1 block text-primary">
                Er zijn inloggegevens opgeslagen voor dit project.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {proxyMessage && (
            <p className="text-sm text-muted-foreground">{proxyMessage}</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="proxy-user">Gebruikersnaam</Label>
              <Input
                id="proxy-user"
                value={proxyAuth.user}
                onChange={(e) =>
                  setProxyAuth({ ...proxyAuth, user: e.target.value })
                }
                placeholder="staging gebruiker"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proxy-password">Wachtwoord</Label>
              <Input
                id="proxy-password"
                type="password"
                value={proxyAuth.password}
                onChange={(e) =>
                  setProxyAuth({ ...proxyAuth, password: e.target.value })
                }
                placeholder={
                  project.hasProxyAuth
                    ? "Laat leeg om huidige te behouden"
                    : "Staging wachtwoord"
                }
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSaveProxyAuth} disabled={proxySaving}>
              Opslaan
            </Button>
            {project.hasProxyAuth && (
              <Button
                variant="outline"
                onClick={handleClearProxyAuth}
                disabled={proxySaving}
              >
                Verwijderen
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

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
                placeholder={`Minimaal ${MIN_PASSWORD_LENGTH} tekens`}
              />
              <p className="text-xs text-muted-foreground">
                Minimaal {MIN_PASSWORD_LENGTH} tekens
              </p>
            </div>
          </div>
          <Button
            onClick={handleCreate}
            disabled={
              saving ||
              !createForm.email ||
              !isPasswordLongEnough(createForm.password)
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
                (editForm.password.length > 0 &&
                  !isPasswordLongEnough(editForm.password))
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
