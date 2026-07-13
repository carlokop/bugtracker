import { useState } from "react";
import { Link } from "react-router-dom";
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

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { message: responseMessage } = await authApi.forgotPassword(email);
      setMessage(responseMessage);
      setEmail("");
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

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <MapPin className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Wachtwoord vergeten
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Vul je e-mailadres in om een resetlink te ontvangen
          </p>
        </div>

        <Card className="border-border/80 shadow-lg">
          <CardHeader className="pb-2 text-center sm:text-left">
            <CardTitle className="text-lg">Reset aanvragen</CardTitle>
            <CardDescription>
              Je ontvangt een e-mail met een link om een nieuw wachtwoord in te
              stellen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {message ? (
              <div className="space-y-4">
                <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-foreground">
                  {message}
                </p>
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    Terug naar inloggen
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
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
                {error && (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  className="h-11 w-full"
                  size="lg"
                  disabled={!email || isLoading}
                >
                  {isLoading ? "Versturen..." : "Resetlink versturen"}
                </Button>
                <Link
                  to="/login"
                  className="block text-center text-sm text-muted-foreground hover:text-foreground"
                >
                  Terug naar inloggen
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
