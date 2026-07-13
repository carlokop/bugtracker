import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeftRight,
  Bell,
  Eye,
  LogOut,
  MapPin,
  MessageSquare,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useProjectContextStore } from "@/store/useProjectContextStore";
import { useProjectStore } from "@/store/useProjectStore";
import { cn } from "@/lib/utils";
import { RoleSwitcher } from "./RoleSwitcher";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { useEffect, useState } from "react";

function isNavActive(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { currentUser, logout } = useAuthStore();
  const { selectedProjectId } = useProjectContextStore();
  const { getProject, getProjectsForUser } = useProjectStore();
  const unreadCount = useNotificationStore((s) =>
    currentUser ? s.getUnreadCount(currentUser.id) : 0,
  );
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [projectCount, setProjectCount] = useState(0);

  useEffect(() => {
    if (selectedProjectId) {
      getProject(selectedProjectId).then((p) => setProjectName(p?.name ?? null));
    } else {
      setProjectName(null);
    }
  }, [selectedProjectId, getProject]);

  useEffect(() => {
    if (!currentUser) return;
    getProjectsForUser(currentUser.id, currentUser.role).then((projects) =>
      setProjectCount(projects.length),
    );
  }, [currentUser, getProjectsForUser]);

  if (!currentUser) return <>{children}</>;

  const isAdmin = currentUser.role === "admin";
  const inProject = Boolean(selectedProjectId);
  const isSelectPage = location.pathname === "/select-project";
  const isViewerPage = location.pathname.includes("/viewer");

  const projectNav = selectedProjectId
    ? [
        {
          to: `/projects/${selectedProjectId}/viewer`,
          label: "Viewer",
          icon: Eye,
        },
        {
          to: `/projects/${selectedProjectId}/feedback`,
          label: "Feedback",
          icon: MessageSquare,
        },
        ...(isAdmin
          ? [
              {
                to: `/projects/${selectedProjectId}/users`,
                label: "Klanten",
                icon: Users,
              },
            ]
          : []),
      ]
    : [];

  const showProjectNav = inProject && !isSelectPage;
  const showSwitchProject = isAdmin || projectCount > 1;

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="hidden w-60 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-sm lg:flex xl:w-64">
        <div className="flex h-14 items-center border-b border-sidebar-border px-5">
          <Link
            to={
              inProject
                ? `/projects/${selectedProjectId}/viewer`
                : "/select-project"
            }
            className="flex items-center gap-2.5 font-semibold text-sidebar-foreground"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
              <MapPin className="h-4 w-4" />
            </div>
            <span>Bugtracker</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {showProjectNav && projectName && (
            <p className="mb-3 rounded-lg bg-sidebar-accent/60 px-3 py-2 text-xs font-medium text-sidebar-accent-foreground line-clamp-2">
              {projectName}
            </p>
          )}
          {showProjectNav ? (
            <>
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Project
              </p>
              {projectNav.map((item) => {
                const Icon = item.icon;
                const active = isNavActive(location.pathname, item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              {showSwitchProject && (
                <Link
                  to="/select-project"
                  className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  Wissel project
                </Link>
              )}
            </>
          ) : (
            <p className="px-3 text-sm text-muted-foreground">
              Kies een project om te beginnen
            </p>
          )}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <RoleSwitcher />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/80 bg-background/90 px-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 sm:px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <MapPin className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                {projectName ?? "Bugtracker"}
              </span>
              {showProjectNav && (
                <span className="block truncate text-[11px] text-muted-foreground">
                  {isViewerPage ? "Viewer" : location.pathname.includes("/feedback") ? "Feedback" : "Project"}
                </span>
              )}
            </div>
          </div>
          <div className="hidden lg:block" />
          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10"
              aria-label="Notificaties"
              onClick={() => setNotifOpen(!notifOpen)}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[10px] font-bold text-destructive-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
            <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-none">
                {currentUser.name}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {currentUser.role === "admin" ? "Developer" : "Klant"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => logout()}
              aria-label="Uitloggen"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {notifOpen && (
          <NotificationPanel onClose={() => setNotifOpen(false)} />
        )}

        <main
          className={cn(
            "flex-1 px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6",
            showProjectNav ? "pb-safe-nav lg:pb-6" : "",
          )}
        >
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
        <MobileNav
          showProjectNav={showProjectNav}
          showSwitchProject={showSwitchProject}
          projectNav={projectNav}
        />
      </div>
    </div>
  );
}

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function MobileNav({
  showProjectNav,
  showSwitchProject,
  projectNav,
}: {
  showProjectNav: boolean;
  showSwitchProject: boolean;
  projectNav: NavItem[];
}) {
  const location = useLocation();
  const { currentUser } = useAuthStore();
  if (!currentUser) return null;

  if (!showProjectNav) return null;

  const items = [
    ...projectNav,
    ...(showSwitchProject
      ? [{ to: "/select-project", label: "Wissel", icon: ArrowLeftRight }]
      : []),
  ];

  return (
    <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-md lg:hidden">
      <div className="flex items-stretch px-1 pt-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(location.pathname, item.to);
          return (
            <Link
              key={item.label}
              to={item.to}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              {active && (
                <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-primary" />
              )}
              <Icon className={cn("h-5 w-5", active && "stroke-[2.25]")} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
