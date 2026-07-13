import { useAuthStore } from "@/store/useAuthStore";

export function RoleSwitcher() {
  const { currentUser } = useAuthStore();

  if (!currentUser) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Ingelogd als</p>
      <p className="text-sm font-medium">
        {currentUser.name} ({currentUser.role})
      </p>
    </div>
  );
}
