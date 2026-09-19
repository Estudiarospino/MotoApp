"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HandCoins } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AbonoForm } from "./abono-form";

export function AbonoDialog({
  prestamoId,
  metodosPago,
  trigger,
}: {
  prestamoId: string;
  metodosPago: { id: string; nombre: string }[];
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent>
        <div className="flex items-start gap-3 pr-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HandCoins className="size-5" />
          </span>
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-semibold text-foreground">Registrar abono</h2>
            <p className="text-sm text-muted-foreground">Aplica un pago al saldo pendiente de este préstamo.</p>
          </div>
        </div>

        <AbonoForm
          prestamoId={prestamoId}
          metodosPago={metodosPago}
          onSuccess={() => {
            toast.success("Abono registrado.");
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
