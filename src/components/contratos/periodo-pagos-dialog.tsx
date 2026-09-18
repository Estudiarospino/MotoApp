"use client";

import { formatCOP } from "@/lib/money";
import { formatFecha } from "@/lib/format";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/** Solo pagos de tipo ARRIENDO llegan aquí: los abonos a capital nunca quedan ligados a un periodo. */
export type PagoDePeriodo = {
  id: string;
  fecha: Date;
  monto: number;
  metodoNombre: string;
};

export function PeriodoPagosDialog({
  numeroPeriodo,
  pagos,
  trigger,
}: {
  numeroPeriodo: number;
  pagos: PagoDePeriodo[];
  trigger: React.ReactNode;
}) {
  const total = pagos.reduce((suma, p) => suma + p.monto, 0);

  return (
    <Dialog>
      {trigger}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pagos del periodo {numeroPeriodo}</DialogTitle>
        </DialogHeader>

        {pagos.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Este periodo se cerró sin pagos registrados.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagos.map((pago) => (
                    <TableRow key={pago.id}>
                      <TableCell>{formatFecha(pago.fecha)}</TableCell>
                      <TableCell className="text-muted-foreground">{pago.metodoNombre}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatCOP(pago.monto)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between px-1 text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold tabular-nums text-foreground">{formatCOP(total)}</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
