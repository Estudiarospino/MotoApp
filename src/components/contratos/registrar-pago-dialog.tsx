"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PagoForm, type MetodoPagoOpcion } from "@/app/(dashboard)/contratos/pago-form";

export function RegistrarPagoDialog({
  contratoId,
  saldoCapitalPendiente,
  metodosPago,
  trigger,
}: {
  contratoId: string;
  saldoCapitalPendiente: number;
  metodosPago: MetodoPagoOpcion[];
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar nuevo pago</DialogTitle>
        </DialogHeader>
        <PagoForm
          contratoId={contratoId}
          saldoCapitalPendiente={saldoCapitalPendiente}
          metodosPago={metodosPago}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
