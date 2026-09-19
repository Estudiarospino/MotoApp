"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Receipt } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { GastoForm } from "./gasto-form";
import { createGasto } from "./actions";

export function GastoDialog({
  defaultOpen = false,
  motos,
  motocicletaIdInicial,
}: {
  defaultOpen?: boolean;
  motos: { id: string; placa: string; marca: string; modelo: string }[];
  motocicletaIdInicial?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants()}>
        <Plus data-icon="inline-start" className="size-4" />
        Nuevo gasto
      </DialogTrigger>
      <DialogContent>
        <div className="flex items-start gap-3 pr-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Receipt className="size-5" />
          </span>
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-semibold text-foreground">Nuevo gasto</h2>
            <p className="text-sm text-muted-foreground">
              Registra un costo de mantenimiento, reparación u otro gasto de la flota.
            </p>
          </div>
        </div>

        <GastoForm
          action={createGasto}
          motos={motos}
          motocicletaIdInicial={motocicletaIdInicial}
          onSuccess={() => {
            toast.success("Gasto creado.");
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
