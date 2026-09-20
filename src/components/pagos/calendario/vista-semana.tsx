import { cn } from "cn";
import { formatCOP } from "@/lib/money";
import { formatFolioContrato } from "@/lib/format";
import { claveDia, inicioDeDia, inicioDeSemana, sumarDias, type PagoCalendario } from "@/server/calendario-pagos";

const DIAS_SEMANA_LARGO = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export function VistaSemana({ fecha, pagosPorDia }: { fecha: Date; pagosPorDia: Map<string, PagoCalendario[]> }) {
  const inicio = inicioDeSemana(fecha);
  const hoy = claveDia(inicioDeDia(new Date()));
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(inicio, i));

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7 sm:gap-2">
      {dias.map((dia, i) => {
        const clave = claveDia(dia);
        const pagosDia = pagosPorDia.get(clave) ?? [];
        const totalDia = pagosDia.reduce((acc, p) => acc + p.monto, 0);
        const esHoy = clave === hoy;

        return (
          <div
            key={clave}
            className={cn(
              "flex flex-col gap-2 rounded-lg border p-2.5",
              esHoy ? "border-primary/40 bg-primary/[0.04]" : "border-border",
            )}
          >
            <div className="flex items-baseline justify-between sm:flex-col sm:items-start sm:gap-0.5">
              <p className={cn("text-sm font-semibold", esHoy ? "text-primary" : "text-foreground")}>
                {DIAS_SEMANA_LARGO[i]} <span className="font-normal text-muted-foreground">{dia.getUTCDate()}</span>
              </p>
              {pagosDia.length > 0 && (
                <p className="text-xs font-medium tabular-nums text-muted-foreground">{formatCOP(totalDia)}</p>
              )}
            </div>

            {pagosDia.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin pagos</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {pagosDia.map((pago) => (
                  <div key={pago.id} className="flex flex-col gap-0.5 rounded-md bg-muted/50 px-2 py-1.5">
                    <p className="truncate text-xs font-medium text-foreground" title={pago.clienteNombre}>
                      {pago.clienteNombre}
                    </p>
                    <div className="flex items-center justify-between gap-1.5">
                      <p className="truncate text-[11px] text-muted-foreground">{formatFolioContrato(pago.folio)}</p>
                      <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
                        {formatCOP(pago.monto)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
