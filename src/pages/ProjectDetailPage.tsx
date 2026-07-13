import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Eye, Mail, Trash2, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/useAuthStore";
import { useProjectStore } from "@/store/useProjectStore";
import type { Project, User } from "@/types";

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentUser } = useAuthStore();
  const { getProject, getProjectMembers, createClientUser, removeClient } =
    useProjectStore();
  const isAdmin = currentUser?.role === "admin";
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

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

  const handleInvite = async () => {
    if (!projectId || !inviteEmail) return;
    setInviting(true);
    await createClientUser(projectId, {
      email: inviteEmail,
    });
    setInviteEmail("");
    setInviting(false);
    load();
  };

  const handleRemove = async (userId: string) => {
    if (!projectId) return;
    await removeClient(projectId, userId);
    load();
  };

  if (!project) {
    return <p className="text-muted-foreground">Project laden...</p>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={project.name}
        description={project.description}
      >
        <Link to={`/projects/${project.id}/viewer`}>
          <Button>
            <Eye className="h-4 w-4" />
            Viewer openen
          </Button>
        </Link>
        <Link to={`/projects/${project.id}/feedback`}>
          <Button variant="outline">Feedbackbord</Button>
        </Link>
      </PageHeader>

      <p className="-mt-4 text-sm text-muted-foreground">{project.targetUrl}</p>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Klanten uitnodigen
            </CardTitle>
            <CardDescription>
              Voeg klanten toe via e-mailadres. Zij ontvangen een mail om een
              wachtwoord in te stellen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="email">E-mailadres</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="klant@voorbeeld.nl"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail}
                >
                  <Mail className="h-4 w-4" />
                  Uitnodigen
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Gekoppelde klanten</h3>
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nog geen klanten gekoppeld
                </p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {members.map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(member.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
