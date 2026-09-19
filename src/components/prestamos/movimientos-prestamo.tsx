"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "cn";
import { formatFecha } from "@/lib/format";
import { formatCOP } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type MovimientoPrestamo = {
  id: string;
  fecha: Date;
  tipo: "PAGO" | "TRANSFERENCIA";
  descripcion: string;
  monto: number;
  referenciaLabel: string | null;
  referenciaHref: string | null;
};

type TabValor = "todos" | "pagos" | "transferencias";

export function MovimientosPrestamo({ movimientos }: { movimientos: MovimientoPrestamo[] }) {
  const [tab, setTab] = useState<TabValor>("todos");
  const pagos = movimientos.filter((m) => m.tipo === "PAGO");
  const transferencias = movimientos.filter((m) => m.tipo === "TRANSFERENCIA");
  const visibles = tab === "todos" ? movimientos : tab === "pagos" ? pagos : transferencias;

  const tabs: { value: TabValor; label: string }[] = [
    { value: "todos", label: `Todos (${movimientos.length})` },
    { value: "pagos", label: `Pagos (${pagos.length})` },
    { value: "transferencias", label: `Transferencias (${transferencias.length})` },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap",
              tab === t.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No hay movimientos en esta categoría.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Referencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibles.map((m, i) => (
                <TableRow key={m.id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>{formatFecha(m.fecha)}</TableCell>
                  <TableCell>
                    <Badge variant={m.tipo === "PAGO" ? "success" : "info"}>
                      {m.tipo === "PAGO" ? "Pago" : "Transferencia"}
                    </Badge>
                  </TableCell>
                  <TableCell>{m.descripcion}</TableCell>
                  <TableCell className="tabular-nums">{formatCOP(m.monto)}</TableCell>
                  <TableCell>
                    {m.referenciaHref ? (
                      <Link href={m.referenciaHref} className="font-medium text-primary hover:underline">
                        {m.referenciaLabel}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">{m.referenciaLabel ?? "—"}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
