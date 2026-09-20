"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatCOP } from "@/lib/money";
import { formatFechaLarga, formatFolioContrato } from "@/lib/format";
import { colorAvatar, iniciales } from "@/lib/avatar";
import type { PagoCalendario } from "@/server/calendario-pagos";

const TIPO_LABEL: Record<PagoCalendario["tipo"], string> = {
  ARRIENDO: "Arriendo",
  ABONO_CAPITAL: "Abono a capital",
};

export function DiaDialog({ fecha, pagos, trigger }: { fecha: Date; pagos: PagoCalendario[]; trigger: React.ReactNode }) {
  const total = pagos.reduce((acc, p) => acc + p.monto, 0);

  return (
    <Dialog>
      {trigger}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{formatFechaLarga(fecha)}</DialogTitle>
        </DialogHeader>

        <p className="-mt-2 text-sm text-muted-foreground">
          {formatCOP(total)} cobrados en {pagos.length} pago{pagos.length === 1 ? "" : "s"}
        </p>

        <div className="-mx-1 flex max-h-96 flex-col gap-1 overflow-y-auto px-1">
          {pagos.map((pago) => {
            const color = colorAvatar(pago.clienteId);
            return (
              <div key={pago.id} className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-muted">
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${color.bg} ${color.text}`}
                >
                  {iniciales(pago.clienteNombre)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{pago.clienteNombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFolioContrato(pago.folio)} · {pago.metodoNombre}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className="text-sm font-semibold tabular-nums text-foreground">{formatCOP(pago.monto)}</span>
                  <Badge variant={pago.tipo === "ABONO_CAPITAL" ? "secondary" : "success"} className="text-[10px]">
                    {TIPO_LABEL[pago.tipo]}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
