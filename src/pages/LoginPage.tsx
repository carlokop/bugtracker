import { useState } from "react";
import { Navigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_USERS } from "@/mock/seed";
import { useAuthStore } from "@/store/useAuthStore";

export function LoginPage() {
  const { currentUser, login, isLoading } = useAuthStore();
  const [selectedUserId, setSelectedUserId] = useState("");

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async () => {
    if (selectedUserId) {
      await login(selectedUserId);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <MapPin className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Bugtracker
            </CardTitle>
            <CardDescription>
              Website feedback & annotatie platform
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-select">Kies een demo-gebruiker</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger id="user-select">
                <SelectValue placeholder="Selecteer gebruiker..." />
              </SelectTrigger>
              <SelectContent>
                {MOCK_USERS.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} —{" "}
                    {user.role === "admin" ? "Developer" : "Klant"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full"
            disabled={!selectedUserId || isLoading}
            onClick={handleLogin}
          >
            {isLoading ? "Inloggen..." : "Inloggen (demo)"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Mock login — geen echte authenticatie in deze fase
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
