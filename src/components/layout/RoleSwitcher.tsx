import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_USERS } from "@/mock/seed";
import { useAuthStore } from "@/store/useAuthStore";

export function RoleSwitcher() {
  const { currentUser, loginAsUser } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Dev: wissel rol</p>
      <Select
        value={currentUser?.id ?? ""}
        onValueChange={async (value) => {
          await loginAsUser(value);
          navigate("/select-project");
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Kies gebruiker" />
        </SelectTrigger>
        <SelectContent>
          {MOCK_USERS.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name} ({user.role})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
