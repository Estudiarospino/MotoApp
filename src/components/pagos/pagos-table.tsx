"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";
import { formatCOP } from "@/lib/money";
import { formatFolioContrato } from "@/lib/format";
import { colorAvatar, iniciales } from "@/lib/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EliminarPagoButton } from "@/app/(dashboard)/contratos/eliminar-pago-button";
import { eliminarPagos } from "@/app/(dashboard)/contratos/pagos-actions";

export type PagoRow = {
  id: string;
  tipo: string;
  fechaLabel: string;
  contratoId: string;
  folio: number;
  clienteId: string;
  clienteNombre: string;
  metodoNombre: string;
  monto: number;
  periodoCierreId: string | null;
};

function esEliminable(pago: PagoRow): boolean {
  return pago.tipo === "ARRIENDO" && pago.periodoCierreId === null;
}

export function PagosTable({ pagos, offset }: { pagos: PagoRow[]; offset: number }) {
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const eliminables = pagos.filter(esEliminable);
  const todosSeleccionados = eliminables.length > 0 && eliminables.every((p) => seleccionados.has(p.id));

  function alternarTodos() {
    setSeleccionados(todosSeleccionados ? new Set() : new Set(eliminables.map((p) => p.id)));
  }

  function alternarUno(id: string) {
    setSeleccionados((actual) => {
      const siguiente = new Set(actual);
      if (siguiente.has(id)) siguiente.delete(id);
      else siguiente.add(id);
      return siguiente;
    });
  }

  function eliminarSeleccionados() {
    if (!confirm(`¿Eliminar ${seleccionados.size} pago(s) seleccionados? Esta acción no se puede deshacer.`)) return;
    startTransition(async () => {
      const resultado = await eliminarPagos([...seleccionados]);
      if (resultado.error) {
        toast.error(resultado.error);
      } else {
        toast.success(`${resultado.eliminados} pago(s) eliminados.`);
        setSeleccionados(new Set());
      }
    });
  }

  return (
    <>
      {seleccionados.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2">
          <p className="text-sm font-medium text-foreground">{seleccionados.size} seleccionado(s)</p>
          <Button type="button" variant="destructive" size="sm" disabled={pending} onClick={eliminarSeleccionados}>
            <Trash2 data-icon="inline-start" className="size-4" />
            {pending ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      )}

      {/* Móvil: lista de tarjetas */}
      <div className="flex flex-col gap-3 sm:hidden">
        {pagos.map((pago) => {
          const color = colorAvatar(pago.clienteId);
          return (
            <div key={pago.id} className="rounded-lg border border-border p-3">
              <div className="mb-1.5 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${color.bg} ${color.text}`}
                  >
                    {iniciales(pago.clienteNombre)}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{pago.clienteNombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFolioContrato(pago.folio)} · {pago.fechaLabel}
                    </p>
                  </div>
                </div>
                <span className="font-semibold tabular-nums text-foreground">{formatCOP(pago.monto)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{pago.metodoNombre}</span>
                {pago.tipo === "ABONO_CAPITAL" ? (
                  <Badge variant="success">Abono a capital</Badge>
                ) : pago.periodoCierreId ? (
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
            </div>
          );
        })}
      </div>

      {/* Escritorio: tabla completa */}
      <div className="hidden overflow-x-auto rounded-lg border border-border sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-9">
                {eliminables.length > 0 && (
                  <Checkbox
                    checked={todosSeleccionados}
                    onCheckedChange={alternarTodos}
                    aria-label="Seleccionar todos los pagos eliminables"
                  />
                )}
              </TableHead>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Contrato</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Método de pago</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Recibo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagos.map((pago, i) => {
              const color = colorAvatar(pago.clienteId);
              const eliminable = esEliminable(pago);
              return (
                <TableRow key={pago.id}>
                  <TableCell>
                    {eliminable && (
                      <Checkbox
                        checked={seleccionados.has(pago.id)}
                        onCheckedChange={() => alternarUno(pago.id)}
                        aria-label={`Seleccionar pago de ${pago.clienteNombre}`}
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{offset + i + 1}</TableCell>
                  <TableCell>{pago.fechaLabel}</TableCell>
                  <TableCell>
                    <Link href={`/contratos/${pago.contratoId}`} className="font-medium hover:underline">
                      {formatFolioContrato(pago.folio)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${color.bg} ${color.text}`}
                      >
                        {iniciales(pago.clienteNombre)}
                      </span>
                      <span className="text-foreground">{pago.clienteNombre}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {pago.tipo === "ABONO_CAPITAL" ? "Abono a capital" : "Arriendo"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{pago.metodoNombre}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatCOP(pago.monto)}</TableCell>
                  <TableCell>
                    {pago.tipo === "ABONO_CAPITAL" ? (
                      <Badge variant="success">Abono a capital</Badge>
                    ) : (
                      <Badge variant={eliminable ? "secondary" : "success"}>
                        {eliminable ? "Periodo abierto" : "Con recibo"}
                      </Badge>
                    )}
                  </TableCell>
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
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{eliminable && <EliminarPagoButton pagoId={pago.id} />}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
