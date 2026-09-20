import { cn } from "cn";
import { DialogTrigger } from "@/components/ui/dialog";
import { formatCOP } from "@/lib/money";
import { claveDia, inicioDeDia, inicioDeMes, rangoMes, sumarDias, type PagoCalendario } from "@/server/calendario-pagos";
import { DiaDialog } from "./dia-dialog";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function bucketIntensidad(monto: number, max: number): string {
  if (max <= 0 || monto <= 0) return "";
  const ratio = monto / max;
  if (ratio > 0.75) return "bg-primary/45";
  if (ratio > 0.5) return "bg-primary/[0.28]";
  if (ratio > 0.25) return "bg-primary/[0.16]";
  return "bg-primary/[0.08]";
}

export function VistaMes({ fecha, pagosPorDia }: { fecha: Date; pagosPorDia: Map<string, PagoCalendario[]> }) {
  const inicioMes = inicioDeMes(fecha);
  const mesActual = inicioMes.getUTCMonth();
  const { desde, hasta } = rangoMes(fecha);

  const dias: Date[] = [];
  for (let d = desde; d.getTime() < hasta.getTime(); d = sumarDias(d, 1)) {
    dias.push(d);
  }

  let maxDia = 0;
  for (const dia of dias) {
    if (dia.getUTCMonth() !== mesActual) continue;
    const total = (pagosPorDia.get(claveDia(dia)) ?? []).reduce((acc, p) => acc + p.monto, 0);
    if (total > maxDia) maxDia = total;
  }

  const hoy = claveDia(inicioDeDia(new Date()));

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground sm:gap-2">
        {DIAS_SEMANA.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {dias.map((dia) => {
          const clave = claveDia(dia);
          const pagosDia = pagosPorDia.get(clave) ?? [];
          const totalDia = pagosDia.reduce((acc, p) => acc + p.monto, 0);
          const esDelMes = dia.getUTCMonth() === mesActual;
          const esHoy = clave === hoy;

          const clasesCelda = cn(
            "flex aspect-square flex-col items-start gap-0.5 rounded-lg border p-1.5 text-left sm:aspect-auto sm:min-h-24 sm:p-2",
            esDelMes ? cn("border-border", bucketIntensidad(totalDia, maxDia)) : "border-transparent opacity-40",
            esHoy && "ring-2 ring-primary ring-inset",
          );

          const contenido = (
            <>
              <span className={cn("text-xs font-medium sm:text-sm", esDelMes ? "text-foreground" : "text-muted-foreground")}>
                {dia.getUTCDate()}
              </span>
              {pagosDia.length > 0 && (
                <>
                  <span className="hidden truncate text-xs font-semibold tabular-nums text-foreground sm:block">
                    {formatCOP(totalDia)}
                  </span>
                  <span className="hidden text-[11px] text-muted-foreground sm:block">
                    {pagosDia.length} pago{pagosDia.length === 1 ? "" : "s"}
                  </span>
                  <span className="mt-auto size-1.5 rounded-full bg-primary sm:hidden" />
                </>
              )}
            </>
          );

          if (pagosDia.length === 0 || !esDelMes) {
            return (
              <div key={clave} className={clasesCelda}>
                {contenido}
              </div>
            );
          }

          return (
            <DiaDialog
              key={clave}
              fecha={dia}
              pagos={pagosDia}
              trigger={
                <DialogTrigger className={cn(clasesCelda, "cursor-pointer transition-colors hover:brightness-95")}>
                  {contenido}
                </DialogTrigger>
              }
            />
          );
        })}
      </div>
    </div>
  );
}
