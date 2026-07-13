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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/useAuthStore";

export function LoginPage() {
  const { currentUser, login, isLoading, loginError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (currentUser) {
    return <Navigate to="/select-project" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      await login(email, password);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <MapPin className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Bugtracker
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Website feedback & annotatie platform
          </p>
        </div>

        <Card className="border-border/80 shadow-lg">
          <CardHeader className="pb-2 text-center sm:text-left">
            <CardTitle className="text-lg">Inloggen</CardTitle>
            <CardDescription>
              Log in met je e-mailadres en wachtwoord
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mailadres</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jouw@email.nl"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Wachtwoord</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11"
                />
              </div>
              {loginError && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {loginError}
                </p>
              )}
              <Button
                type="submit"
                className="h-11 w-full"
                size="lg"
                disabled={!email || !password || isLoading}
              >
                {isLoading ? "Inloggen..." : "Inloggen"}
              </Button>
            </form>
            <p className="mt-5 rounded-xl bg-muted/60 px-3 py-2.5 text-center text-xs leading-relaxed text-muted-foreground">
              Admin: info@websitediewerkt.nl
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
