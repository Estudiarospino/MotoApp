import { ClipboardList, HandCoins, ReceiptText, Wrench } from "lucide-react";
import { cn } from "cn";
import { formatCOP } from "@/lib/money";
import { formatFecha } from "@/lib/format";
import type { Movimiento } from "@/server/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ICONO_POR_TIPO: Record<Movimiento["tipo"], typeof Wrench> = {
  gasto: Wrench,
  pago: ReceiptText,
  contrato: ClipboardList,
  prestamo: HandCoins,
};

const TONO_POR_TIPO: Record<Movimiento["tipo"], string> = {
  gasto: "bg-warning/10 text-warning",
  pago: "bg-success/10 text-success",
  contrato: "bg-primary/10 text-primary",
  prestamo: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

export function RecentActivity({ movimientos }: { movimientos: Movimiento[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Últimos movimientos</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {movimientos.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Todavía no hay actividad registrada.</p>
        ) : (
          movimientos.map((mov) => {
            const Icon = ICONO_POR_TIPO[mov.tipo];
            return (
              <div key={mov.id} className="flex items-start gap-3 py-2">
                <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg", TONO_POR_TIPO[mov.tipo])}>
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{mov.titulo}</p>
                  <p className="truncate text-xs text-muted-foreground">{mov.detalle}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-medium tabular-nums text-foreground">{formatCOP(mov.monto)}</p>
                  <p className="text-xs text-muted-foreground">{formatFecha(mov.fecha)}</p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
