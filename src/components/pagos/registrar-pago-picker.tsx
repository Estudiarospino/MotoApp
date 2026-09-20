"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, Search } from "lucide-react";
import { formatFolioContrato } from "@/lib/format";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PagoForm, type MetodoPagoOpcion } from "@/app/(dashboard)/contratos/pago-form";

export type ContratoParaPago = {
  id: string;
  folio: number;
  clienteNombre: string;
  motoNombre: string;
  saldoCapitalPendiente: number;
};

export function RegistrarPagoPicker({
  contratos,
  metodosPago,
  contratoIdInicial,
  trigger,
}: {
  contratos: ContratoParaPago[];
  metodosPago: MetodoPagoOpcion[];
  contratoIdInicial?: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [contratoId, setContratoId] = useState(contratoIdInicial ?? "");
  const [busqueda, setBusqueda] = useState("");

  const contratoSeleccionado = contratos.find((c) => c.id === contratoId);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return contratos;
    return contratos.filter(
      (c) =>
        c.clienteNombre.toLowerCase().includes(q) ||
        c.motoNombre.toLowerCase().includes(q) ||
        formatFolioContrato(c.folio).toLowerCase().includes(q),
    );
  }, [contratos, busqueda]);

  function alCerrar(abierto: boolean) {
    setOpen(abierto);
    if (!abierto) {
      setContratoId(contratoIdInicial ?? "");
      setBusqueda("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={alCerrar}>
      {trigger}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar nuevo pago</DialogTitle>
        </DialogHeader>

        {contratoSeleccionado ? (
          <>
            {!contratoIdInicial && (
              <button
                type="button"
                onClick={() => setContratoId("")}
                className="-mt-2 flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
                Cambiar contrato
              </button>
            )}
            <p className="-mt-2 text-sm text-muted-foreground">
              {formatFolioContrato(contratoSeleccionado.folio)} — {contratoSeleccionado.clienteNombre} ·{" "}
              {contratoSeleccionado.motoNombre}
            </p>
            <PagoForm
              contratoId={contratoSeleccionado.id}
              saldoCapitalPendiente={contratoSeleccionado.saldoCapitalPendiente}
              metodosPago={metodosPago}
              onSuccess={() => setOpen(false)}
            />
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por cliente o folio..."
                className="pl-9"
                autoFocus
              />
            </div>
            <div className="-mx-1 flex max-h-72 flex-col gap-0.5 overflow-y-auto px-1">
              {filtrados.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Ningún contrato activo coincide.</p>
              ) : (
                filtrados.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setContratoId(c.id)}
                    className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-medium text-foreground">{c.clienteNombre}</span>
                      <span className="truncate text-xs text-muted-foreground">{c.motoNombre}</span>
                    </span>
                    <span className="shrink-0 text-muted-foreground">{formatFolioContrato(c.folio)}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
