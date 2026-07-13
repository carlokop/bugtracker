import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import type { Notification } from "@/types";

export function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { currentUser } = useAuthStore();
  const { fetchNotifications, markAsRead, markAllAsRead } =
    useNotificationStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications(currentUser.id).then(setNotifications);
    }
  }, [currentUser, fetchNotifications]);

  if (!currentUser) return null;

  const handleMarkAll = async () => {
    await markAllAsRead(currentUser.id);
    const updated = await fetchNotifications(currentUser.id);
    setNotifications(updated);
  };

  const handleMarkOne = async (id: string) => {
    await markAsRead(id);
    const updated = await fetchNotifications(currentUser.id);
    setNotifications(updated);
  };

  return (
    <div className="absolute right-2 top-14 z-50 w-[calc(100vw-1rem)] max-w-80 overflow-hidden rounded-xl border bg-popover shadow-lg sm:right-4 md:right-6">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Notificaties</h3>
        <div className="flex gap-0.5">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleMarkAll}>
            <CheckCheck className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Geen notificaties
          </p>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={cn(
                "border-b border-border/60 px-4 py-3 last:border-0",
                !notif.read && "bg-primary/5",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bell className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">{notif.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(notif.createdAt)}
                  </p>
                  <div className="mt-2 flex gap-3">
                    <Link
                      to={`/feedback/${notif.referenceId}`}
                      className="text-xs font-medium text-primary hover:underline"
                      onClick={onClose}
                    >
                      Bekijken
                    </Link>
                    {!notif.read && (
                      <button
                        className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                        onClick={() => handleMarkOne(notif.id)}
                      >
                        Markeer als gelezen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
