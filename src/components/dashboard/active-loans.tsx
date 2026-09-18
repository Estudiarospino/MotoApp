import Link from "next/link";
import { formatCOP } from "@/lib/money";
import type { PrestamoActivo } from "@/server/dashboard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ActiveLoans({ items, totalPendiente }: { items: PrestamoActivo[]; totalPendiente: number }) {
  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Préstamos activos</CardTitle>
        <Link href="/prestamos" className="text-xs font-medium text-primary hover:underline">
          Ver todos
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No hay préstamos activos.</p>
        ) : (
          <>
            <div className="flex flex-col gap-2.5">
              {items.map((p) => (
                <Link
                  key={p.id}
                  href={`/prestamos/${p.id}`}
                  className="flex items-center justify-between rounded-lg px-1 py-1 text-sm hover:bg-muted"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{p.cliente}</p>
                    <p className="text-xs text-muted-foreground">Original {formatCOP(p.montoOriginal)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-medium tabular-nums text-foreground">{formatCOP(p.saldoPendiente)}</p>
                    <Badge variant="warning" className="mt-0.5">
                      Activo
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-2 flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2.5 text-sm font-medium text-foreground">
              <span>Total pendiente</span>
              <span className="tabular-nums">{formatCOP(totalPendiente)}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
