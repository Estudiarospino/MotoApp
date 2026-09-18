"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormFieldError } from "@/components/form-field-error";
import { crearCuenta, type ConfiguracionFormState } from "./actions";

const ESTADO_INICIAL: ConfiguracionFormState = {};

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando..." : "Crear cuenta"}
    </Button>
  );
}

function NuevaCuentaForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction] = useActionState(crearCuenta, ESTADO_INICIAL);

  useEffect(() => {
    if (state.ok) {
      toast.success("Cuenta creada.");
      onSuccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="nombre">Nombre de la cuenta</Label>
          <Input id="nombre" name="nombre" placeholder="Ej: Bancolombia ahorros" required />
          <FormFieldError mensajes={state.fieldErrors?.nombre} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="titular">Titular</Label>
          <Input id="titular" name="titular" placeholder="Nombre del dueño de la cuenta" required />
          <FormFieldError mensajes={state.fieldErrors?.titular} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="banco">Banco</Label>
          <Input id="banco" name="banco" placeholder="Opcional" />
          <FormFieldError mensajes={state.fieldErrors?.banco} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="numeroCuenta">Número de cuenta</Label>
          <Input id="numeroCuenta" name="numeroCuenta" placeholder="Opcional" />
          <FormFieldError mensajes={state.fieldErrors?.numeroCuenta} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="saldoInicial">Saldo inicial (COP)</Label>
        <Input id="saldoInicial" name="saldoInicial" type="number" defaultValue={0} />
        <p className="text-xs text-muted-foreground">Lo que ya había en la cuenta antes de empezar a registrar aquí.</p>
        <FormFieldError mensajes={state.fieldErrors?.saldoInicial} />
      </div>

      <div>
        <BotonGuardar />
      </div>
    </form>
  );
}

export function NuevaCuentaDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants({ size: "sm" })}>
        <Plus data-icon="inline-start" className="size-4" />
        Nueva cuenta
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva cuenta</DialogTitle>
        </DialogHeader>
        <NuevaCuentaForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
