import Link from "next/link";
import { cn } from "cn";
import type { EstadoFlotaItem } from "@/server/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ESTADO_LABEL: Record<EstadoFlotaItem["estado"], string> = {
  DISPONIBLE: "Disponible",
  EN_CONTRATO: "En contrato",
  VENDIDA: "Vendida",
};

const ESTADO_COLOR: Record<EstadoFlotaItem["estado"], string> = {
  DISPONIBLE: "bg-success",
  EN_CONTRATO: "bg-primary",
  VENDIDA: "bg-muted-foreground",
};

export function FleetStatus({ items }: { items: EstadoFlotaItem[] }) {
  const total = items.reduce((acc, i) => acc + i.cantidad, 0);

  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Estado de la flota</CardTitle>
        <Link href="/motos" className="text-xs font-medium text-primary hover:underline">
          Ver todas
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.map((item) => {
          const pct = total === 0 ? 0 : Math.round((item.cantidad / total) * 100);
          return (
            <div key={item.estado} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-foreground">
                  <span className={cn("size-2 rounded-full", ESTADO_COLOR[item.estado])} />
                  {ESTADO_LABEL[item.estado]}
                </span>
                <span className="text-muted-foreground">
                  {item.cantidad} · {pct}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full", ESTADO_COLOR[item.estado])} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}

        <div className="mt-1 flex items-center justify-between border-t border-border pt-3 text-sm font-medium text-foreground">
          <span>Total</span>
          <span className="tabular-nums">{total}</span>
        </div>
      </CardContent>
    </Card>
  );
}
