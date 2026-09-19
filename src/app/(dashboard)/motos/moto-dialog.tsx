"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bike, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { MotoForm } from "./moto-form";
import { createMotocicleta } from "./actions";

export function MotoDialog({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants()}>
        <Plus data-icon="inline-start" className="size-4" />
        Nueva moto
      </DialogTrigger>
      <DialogContent>
        <div className="flex items-start gap-3 pr-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bike className="size-5" />
          </span>
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-semibold text-foreground">Nueva moto</h2>
            <p className="text-sm text-muted-foreground">
              Registra una motocicleta para agregarla al inventario de la flota.
            </p>
          </div>
        </div>

        <MotoForm
          action={createMotocicleta}
          onSuccess={() => {
            toast.success("Moto creada.");
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
