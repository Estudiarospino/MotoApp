"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, UserPlus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ClienteForm } from "./cliente-form";
import { createCliente } from "./actions";

export function ClienteDialog({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants()}>
        <Plus data-icon="inline-start" className="size-4" />
        Nuevo cliente
      </DialogTrigger>
      <DialogContent>
        <div className="flex items-start gap-3 pr-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserPlus className="size-5" />
          </span>
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-semibold text-foreground">Nuevo cliente</h2>
            <p className="text-sm text-muted-foreground">
              Registra la información del cliente para asociarlo a contratos y arrendamientos.
            </p>
          </div>
        </div>

        <ClienteForm
          action={createCliente}
          onSuccess={() => {
            toast.success("Cliente creado.");
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
