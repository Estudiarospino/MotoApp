import { redirect } from "next/navigation";
import { Bike } from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { login } from "./actions";

const MENSAJES_ERROR: Record<string, string> = {
  "1": "Correo o contraseña incorrectos.",
  bloqueado: "Demasiados intentos fallidos. Intenta de nuevo en unos minutos.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const usuario = await getCurrentUser();
  if (usuario) {
    redirect("/");
  }

  const { error } = await searchParams;
  const mensajeError = error ? (MENSAJES_ERROR[error] ?? MENSAJES_ERROR["1"]) : null;

  return (
    <main className="flex flex-1 items-center justify-center bg-muted/30 px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Bike className="size-6 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-foreground">Gestión de Motos</h1>
            <p className="text-sm text-muted-foreground">Control de contratos, pagos y cartera</p>
          </div>
        </div>

        <Card className="w-full">
          <CardContent>
            {mensajeError && (
              <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {mensajeError}
              </p>
            )}

            <form action={login} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="email">Correo</Label>
                <Input id="email" name="email" type="email" required autoComplete="username" />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" className="mt-2">
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
