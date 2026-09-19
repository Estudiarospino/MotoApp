"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowRightLeft } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TransferenciaCapitalForm } from "./transferencia-capital-form";

export function TransferenciaDialog({
  prestamoId,
  saldoPendiente,
  contratos,
  contratoIdInicial,
  trigger,
}: {
  prestamoId: string;
  saldoPendiente: number;
  contratos: { id: string; folio: number }[];
  contratoIdInicial?: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent>
        <div className="flex items-start gap-3 pr-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ArrowRightLeft className="size-5" />
          </span>
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-semibold text-foreground">Transferir a capital</h2>
            <p className="text-sm text-muted-foreground">
              Traslada el saldo de este préstamo al capital pendiente de un contrato del mismo cliente.
            </p>
          </div>
        </div>

        <TransferenciaCapitalForm
          prestamoId={prestamoId}
          saldoPendiente={saldoPendiente}
          contratos={contratos}
          contratoIdInicial={contratoIdInicial}
          onSuccess={() => {
            toast.success("Transferencia registrada.");
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
