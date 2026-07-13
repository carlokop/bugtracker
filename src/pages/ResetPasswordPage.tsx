import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
import * as authApi from "@/api/auth";
import { ApiError } from "@/api/client";
import {
  MIN_PASSWORD_LENGTH,
  getPasswordLengthError,
  isPasswordLongEnough,
} from "@/lib/password";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const canSubmit =
    token &&
    isPasswordLongEnough(password) &&
    passwordsMatch &&
    !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    setError(null);

    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Er ging iets mis. Probeer het later opnieuw.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md border-border/80 shadow-lg">
          <CardHeader>
            <CardTitle>Ongeldige link</CardTitle>
            <CardDescription>
              Deze wachtwoord-reset link is ongeldig. Vraag een nieuwe aan.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Link to="/forgot-password" className="flex-1">
              <Button className="w-full">Nieuwe reset aanvragen</Button>
            </Link>
            <Link to="/login" className="flex-1">
              <Button variant="outline" className="w-full">
                Inloggen
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <MapPin className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Wachtwoord instellen
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Kies een nieuw wachtwoord voor je account
          </p>
        </div>

        <Card className="border-border/80 shadow-lg">
          <CardHeader className="pb-2 text-center sm:text-left">
            <CardTitle className="text-lg">Nieuw wachtwoord</CardTitle>
            <CardDescription>
              Minimaal {MIN_PASSWORD_LENGTH} tekens
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4">
                <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-foreground">
                  Je wachtwoord is ingesteld. Je kunt nu inloggen.
                </p>
                <Link to="/login">
                  <Button className="h-11 w-full" size="lg">
                    Naar inloggen
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nieuw wachtwoord</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11"
                  />
                  {password.length > 0 && !isPasswordLongEnough(password) && (
                    <p className="text-xs text-destructive">
                      {getPasswordLengthError()}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Bevestig wachtwoord</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11"
                  />
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="text-xs text-destructive">
                      Wachtwoorden komen niet overeen
                    </p>
                  )}
                </div>
                {error && (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  className="h-11 w-full"
                  size="lg"
                  disabled={!canSubmit}
                >
                  {isLoading ? "Opslaan..." : "Wachtwoord opslaan"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
