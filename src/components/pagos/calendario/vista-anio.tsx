import Link from "next/link";
import { cn } from "cn";
import { formatCOP } from "@/lib/money";
import { Progress } from "@/components/ui/progress";
import type { MesResumen } from "@/server/calendario-pagos";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function VistaAnio({ anio, resumenMeses }: { anio: number; resumenMeses: MesResumen[] }) {
  const maxMes = Math.max(0, ...resumenMeses.map((m) => m.total));
  const ahora = new Date();
  const mesActual = ahora.getUTCFullYear() === anio ? ahora.getUTCMonth() : -1;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {resumenMeses.map((resumen) => {
        const intensidad = maxMes > 0 ? Math.round((resumen.total / maxMes) * 100) : 0;
        return (
          <Link
            key={resumen.mes}
            href={`/pagos/calendario?vista=mes&fecha=${anio}-${String(resumen.mes + 1).padStart(2, "0")}-01`}
            className={cn(
              "flex flex-col gap-2 rounded-xl border p-4 transition-colors hover:border-primary/40 hover:bg-muted/40",
              resumen.mes === mesActual ? "border-primary/40 bg-primary/[0.04]" : "border-border",
            )}
          >
            <p className="text-sm font-semibold text-foreground">{MESES[resumen.mes]}</p>
            <p className="text-lg font-semibold tabular-nums text-foreground">{formatCOP(resumen.total)}</p>
            <p className="text-xs text-muted-foreground">
              {resumen.cantidad} pago{resumen.cantidad === 1 ? "" : "s"}
            </p>
            <Progress value={intensidad} />
          </Link>
        );
      })}
    </div>
  );
}
