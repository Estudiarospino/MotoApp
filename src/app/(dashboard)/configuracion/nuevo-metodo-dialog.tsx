"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormFieldError } from "@/components/form-field-error";
import { crearMetodoPago, type ConfiguracionFormState } from "./actions";

const ESTADO_INICIAL: ConfiguracionFormState = {};

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando..." : "Crear método"}
    </Button>
  );
}

function NuevoMetodoForm({
  cuentas,
  onSuccess,
}: {
  cuentas: { id: string; nombre: string }[];
  onSuccess: () => void;
}) {
  const [state, formAction] = useActionState(crearMetodoPago, ESTADO_INICIAL);

  useEffect(() => {
    if (state.ok) {
      toast.success("Método de pago creado.");
      onSuccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex flex-col gap-1">
        <Label htmlFor="nombreMetodo">Nombre</Label>
        <Input id="nombreMetodo" name="nombre" placeholder="Ej: Nequi, Efectivo, Transferencia" required />
        <FormFieldError mensajes={state.fieldErrors?.nombre} />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="cuentaId">Cuenta a la que llega el dinero</Label>
        <Select name="cuentaId">
          <SelectTrigger id="cuentaId" className="w-full">
            <SelectValue placeholder="Selecciona una cuenta">
              {(v: string) => cuentas.find((c) => c.id === v)?.nombre ?? v}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {cuentas.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormFieldError mensajes={state.fieldErrors?.cuentaId} />
      </div>

      <div>
        <BotonGuardar />
      </div>
    </form>
  );
}

export function NuevoMetodoDialog({ cuentas }: { cuentas: { id: string; nombre: string }[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants({ size: "sm" })} disabled={cuentas.length === 0}>
        <Plus data-icon="inline-start" className="size-4" />
        Nuevo método
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo método de pago</DialogTitle>
        </DialogHeader>
        <NuevoMetodoForm cuentas={cuentas} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
