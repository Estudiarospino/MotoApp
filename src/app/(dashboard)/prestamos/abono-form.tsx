"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormFieldError } from "@/components/form-field-error";
import { registrarAbono, type AbonoFormState } from "./actions";

const ESTADO_INICIAL: AbonoFormState = {};

function BotonRegistrar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      <Plus data-icon="inline-start" className="size-4" />
      {pending ? "Registrando..." : "Registrar abono"}
    </Button>
  );
}

export function AbonoForm({ prestamoId }: { prestamoId: string }) {
  const action = registrarAbono.bind(null, prestamoId);
  const [state, formAction] = useActionState(action, ESTADO_INICIAL);

  return (
    <form action={formAction} className="flex flex-col gap-3 border-t border-border pt-4">
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="fecha">Fecha</Label>
          <Input id="fecha" name="fecha" type="date" required />
          <FormFieldError mensajes={state.fieldErrors?.fecha} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="monto">Monto (COP)</Label>
          <Input id="monto" name="monto" type="number" required />
          <FormFieldError mensajes={state.fieldErrors?.monto} />
        </div>
      </div>

      <div>
        <BotonRegistrar />
      </div>
    </form>
  );
}
