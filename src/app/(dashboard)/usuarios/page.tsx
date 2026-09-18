import { getCurrentUser } from "@/server/auth/session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function UsuariosPage() {
  const usuario = await getCurrentUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          MotoGestión está pensado para un solo usuario administrador por ahora.
        </p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground">
            {usuario?.nombre
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase())
              .join("")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground">{usuario?.nombre}</p>
            <p className="truncate text-sm text-muted-foreground">{usuario?.email}</p>
          </div>
          <Badge variant="secondary">Administrador</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
