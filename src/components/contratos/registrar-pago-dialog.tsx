"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PagoForm } from "@/app/(dashboard)/contratos/pago-form";

export function RegistrarPagoDialog({
  contratoId,
  trigger,
}: {
  contratoId: string;
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
        <PagoForm contratoId={contratoId} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
