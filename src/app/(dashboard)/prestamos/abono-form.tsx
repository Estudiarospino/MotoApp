"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Banknote, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormFieldError } from "@/components/form-field-error";
import { SIN_SELECCION } from "@/lib/validation/prestamo";
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

export function AbonoForm({
  prestamoId,
  metodosPago,
  onSuccess,
  onCancel,
}: {
  prestamoId: string;
  metodosPago: { id: string; nombre: string }[];
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const action = registrarAbono.bind(null, prestamoId);
  const [state, formAction] = useActionState(action, ESTADO_INICIAL);

  useEffect(() => {
    if (state.ok) {
      onSuccess?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
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
          <div className="relative">
            <Banknote className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="monto" name="monto" type="number" className="pl-8" required />
          </div>
          <FormFieldError mensajes={state.fieldErrors?.monto} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="metodoPagoId">Método de pago (opcional)</Label>
        <Select name="metodoPagoId" defaultValue={SIN_SELECCION}>
          <SelectTrigger id="metodoPagoId" className="w-full">
            <SelectValue>
              {(v: string) => {
                if (v === SIN_SELECCION) return "Sin especificar";
                return metodosPago.find((m) => m.id === v)?.nombre ?? v;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SIN_SELECCION}>Sin especificar</SelectItem>
            {metodosPago.map((metodo) => (
              <SelectItem key={metodo.id} value={metodo.id}>
                {metodo.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormFieldError mensajes={state.fieldErrors?.metodoPagoId} />
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            <X data-icon="inline-start" className="size-4" />
            Cancelar
          </Button>
        )}
        <BotonRegistrar />
      </div>
    </form>
  );
}
