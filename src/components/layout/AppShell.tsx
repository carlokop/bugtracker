import { Link, useLocation } from "react-router-dom";
import {
  Bell,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { cn } from "@/lib/utils";
import { RoleSwitcher } from "./RoleSwitcher";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { useState } from "react";

const adminNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projecten", icon: FolderKanban },
  { to: "/feedback", label: "Feedback", icon: MessageSquare },
];

const clientNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/feedback", label: "Feedback", icon: MessageSquare },
];

function isNavActive(pathname: string, to: string) {
  return (
    pathname.startsWith(to) ||
    (to === "/feedback" && pathname.includes("/feedback"))
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { currentUser, logout } = useAuthStore();
  const unreadCount = useNotificationStore((s) =>
    currentUser ? s.getUnreadCount(currentUser.id) : 0,
  );
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);

  if (!currentUser) return <>{children}</>;

  const navItems = currentUser.role === "admin" ? adminNav : clientNav;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-14 items-center border-b border-sidebar-border px-5">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 font-semibold text-sidebar-foreground"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <MapPin className="h-4 w-4" />
            </div>
            <span>Bugtracker</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Navigatie
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(location.pathname, item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <RoleSwitcher />
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <MapPin className="h-3.5 w-3.5" />
            </div>
            <span className="font-semibold">Bugtracker</span>
          </div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Notificaties"
              onClick={() => setNotifOpen(!notifOpen)}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
            </Button>
            <div className="mx-2 hidden h-6 w-px bg-border sm:block" />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-none">
                {currentUser.name}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {currentUser.role === "admin" ? "Developer" : "Klant"}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => logout()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {notifOpen && (
          <NotificationPanel onClose={() => setNotifOpen(false)} />
        )}

        <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}

export function MobileNav() {
  const location = useLocation();
  const { currentUser } = useAuthStore();
  if (!currentUser) return null;

  const navItems =
    currentUser.role === "admin" ? adminNav : clientNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-background/95 backdrop-blur-sm md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isNavActive(location.pathname, item.to);
        return (
          <Link
            key={item.label}
            to={item.to}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
      {currentUser.role === "admin" && (
        <button
          type="button"
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium text-muted-foreground"
          onClick={() => {
            const bell = document.querySelector<HTMLButtonElement>(
              '[aria-label="Notificaties"]',
            );
            bell?.click();
          }}
        >
          <Bell className="h-5 w-5" />
          Meldingen
        </button>
      )}
    </nav>
  );
}
