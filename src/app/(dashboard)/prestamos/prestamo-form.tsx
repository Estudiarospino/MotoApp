"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormFieldError } from "@/components/form-field-error";
import { createPrestamo, type PrestamoFormState } from "./actions";

const ESTADO_INICIAL: PrestamoFormState = {};

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando..." : "Guardar"}
    </Button>
  );
}

export function PrestamoForm({
  clientes,
}: {
  clientes: { id: string; nombreCompleto: string; numeroIdentificacion: string }[];
}) {
  const [state, formAction] = useActionState(createPrestamo, ESTADO_INICIAL);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex flex-col gap-1">
        <Label htmlFor="clienteId">Cliente</Label>
        <Select name="clienteId">
          <SelectTrigger id="clienteId" className="w-full">
            <SelectValue placeholder="Selecciona un cliente" />
          </SelectTrigger>
          <SelectContent>
            {clientes.map((cliente) => (
              <SelectItem key={cliente.id} value={cliente.id}>
                {cliente.nombreCompleto} — {cliente.numeroIdentificacion}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormFieldError mensajes={state.fieldErrors?.clienteId} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="fecha">Fecha</Label>
          <Input id="fecha" name="fecha" type="date" required />
          <FormFieldError mensajes={state.fieldErrors?.fecha} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="montoOriginal">Monto (COP)</Label>
          <Input id="montoOriginal" name="montoOriginal" type="number" required />
          <FormFieldError mensajes={state.fieldErrors?.montoOriginal} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="motivo">Motivo</Label>
        <Textarea id="motivo" name="motivo" rows={2} />
        <FormFieldError mensajes={state.fieldErrors?.motivo} />
      </div>

      <div>
        <BotonGuardar />
      </div>
    </form>
  );
}
