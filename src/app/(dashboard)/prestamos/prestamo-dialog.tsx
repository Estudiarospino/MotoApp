"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HandCoins, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { PrestamoForm } from "./prestamo-form";

export function PrestamoDialog({
  defaultOpen = false,
  clientes,
  motos,
}: {
  defaultOpen?: boolean;
  clientes: { id: string; nombreCompleto: string; numeroIdentificacion: string }[];
  motos: { id: string; placa: string; marca: string; modelo: string }[];
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants()}>
        <Plus data-icon="inline-start" className="size-4" />
        Nuevo préstamo
      </DialogTrigger>
      <DialogContent>
        <div className="flex items-start gap-3 pr-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HandCoins className="size-5" />
          </span>
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-semibold text-foreground">Nuevo préstamo</h2>
            <p className="text-sm text-muted-foreground">
              Registra un préstamo a un cliente, independiente del arriendo.
            </p>
          </div>
        </div>

        <PrestamoForm
          clientes={clientes}
          motos={motos}
          onSuccess={() => {
            toast.success("Préstamo registrado.");
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
