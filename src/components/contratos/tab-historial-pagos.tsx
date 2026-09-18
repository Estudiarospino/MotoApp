import Link from "next/link";
import { Download, Receipt } from "lucide-react";
import { formatCOP } from "@/lib/money";
import { formatFecha } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EliminarPagoButton } from "@/app/(dashboard)/contratos/eliminar-pago-button";

const METODO_LABEL: Record<string, string> = {
  TRANSFERENCIA: "Transferencia",
  EFECTIVO: "Efectivo",
  OTRO: "Otro",
};

export type PagoHistorialItem = {
  id: string;
  fecha: Date;
  monto: number;
  metodo: string;
  referencia: string | null;
  periodoCierreId: string | null;
  periodo: { numeroPeriodo: number; arriendoCubierto: number; abonoCapital: number; moraNueva: number } | null;
};

export function TabHistorialPagos({ contratoId, pagos }: { contratoId: string; pagos: PagoHistorialItem[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="size-4 text-muted-foreground" />
            Historial de pagos
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Todos los pagos registrados en este contrato.</p>
        </div>
        {pagos.length > 0 && (
          <a href={`/api/contratos/${contratoId}/pagos/export`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Download data-icon="inline-start" className="size-4" />
            Exportar
          </a>
        )}
      </CardHeader>
      <CardContent>
        {pagos.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Todavía no hay pagos registrados.</p>
        ) : (
          <>
            {/* Móvil: tarjetas apiladas */}
            <div className="flex flex-col gap-3 sm:hidden">
              {pagos.map((pago) => (
                <div key={pago.id} className="rounded-lg border border-border p-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{formatFecha(pago.fecha)}</span>
                    <span className="font-semibold tabular-nums text-foreground">{formatCOP(pago.monto)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{METODO_LABEL[pago.metodo] ?? pago.metodo}</span>
                    {pago.periodoCierreId ? (
                      <Link href={`/api/recibos/${pago.periodoCierreId}`} target="_blank" className="text-primary hover:underline">
                        Ver recibo
                      </Link>
                    ) : (
                      <span className="flex items-center gap-1">
                        Periodo abierto
                        <EliminarPagoButton pagoId={pago.id} />
                      </span>
                    )}
                  </div>
                  {pago.periodo && (
                    <div className="mt-2 grid grid-cols-3 gap-2 border-t border-border pt-2 text-xs">
                      <Campo etiqueta="Arriendo" valor={formatCOP(pago.periodo.arriendoCubierto)} />
                      <Campo etiqueta="A capital" valor={formatCOP(pago.periodo.abonoCapital)} />
                      <Campo etiqueta="Mora" valor={formatCOP(pago.periodo.moraNueva)} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto rounded-lg border border-border sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Arriendo</TableHead>
                    <TableHead>A capital</TableHead>
                    <TableHead>Mora</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Recibo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagos.map((pago, i) => (
                    <TableRow key={pago.id}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>{formatFecha(pago.fecha)}</TableCell>
                      <TableCell className="font-medium tabular-nums">{formatCOP(pago.monto)}</TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {pago.periodo ? formatCOP(pago.periodo.arriendoCubierto) : "—"}
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {pago.periodo ? formatCOP(pago.periodo.abonoCapital) : "—"}
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {pago.periodo ? formatCOP(pago.periodo.moraNueva) : "—"}
                      </TableCell>
                      <TableCell>{METODO_LABEL[pago.metodo] ?? pago.metodo}</TableCell>
                      <TableCell>
                        {pago.periodoCierreId ? (
                          <Link
                            href={`/api/recibos/${pago.periodoCierreId}`}
                            target="_blank"
                            className={buttonVariants({ variant: "outline", size: "sm" })}
                          >
                            <Download className="size-3.5" />
                            Recibo
                          </Link>
                        ) : (
                          <Badge variant="secondary">Periodo abierto</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!pago.periodoCierreId && <EliminarPagoButton pagoId={pago.id} />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Campo({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground">{etiqueta}</span>
      <span className="font-medium text-foreground">{valor}</span>
    </div>
  );
}
