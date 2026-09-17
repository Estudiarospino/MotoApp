"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormFieldError } from "@/components/form-field-error";
import type { MotocicletaFormState } from "./actions";

const ESTADO_INICIAL: MotocicletaFormState = {};

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando..." : "Guardar"}
    </Button>
  );
}

export function MotoForm({
  action,
  valoresIniciales,
}: {
  action: (state: MotocicletaFormState, formData: FormData) => Promise<MotocicletaFormState>;
  valoresIniciales?: {
    marca?: string;
    modelo?: string;
    placa?: string;
    color?: string;
    anioModelo?: string;
    precioInicial?: string;
    notas?: string;
  };
}) {
  const [state, formAction] = useActionState(action, ESTADO_INICIAL);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="marca">Marca</Label>
          <Input id="marca" name="marca" defaultValue={valoresIniciales?.marca} required />
          <FormFieldError mensajes={state.fieldErrors?.marca} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="modelo">Modelo</Label>
          <Input id="modelo" name="modelo" defaultValue={valoresIniciales?.modelo} required />
          <FormFieldError mensajes={state.fieldErrors?.modelo} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="placa">Placa</Label>
          <Input id="placa" name="placa" defaultValue={valoresIniciales?.placa} required />
          <FormFieldError mensajes={state.fieldErrors?.placa} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="anioModelo">Año</Label>
          <Input
            id="anioModelo"
            name="anioModelo"
            type="number"
            defaultValue={valoresIniciales?.anioModelo}
          />
          <FormFieldError mensajes={state.fieldErrors?.anioModelo} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="color">Color</Label>
          <Input id="color" name="color" defaultValue={valoresIniciales?.color} />
          <FormFieldError mensajes={state.fieldErrors?.color} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="precioInicial">Precio inicial (COP)</Label>
          <Input
            id="precioInicial"
            name="precioInicial"
            type="number"
            defaultValue={valoresIniciales?.precioInicial}
            required
          />
          <FormFieldError mensajes={state.fieldErrors?.precioInicial} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="notas">Notas</Label>
        <Textarea id="notas" name="notas" defaultValue={valoresIniciales?.notas} rows={3} />
        <FormFieldError mensajes={state.fieldErrors?.notas} />
      </div>

      <div>
        <BotonGuardar />
      </div>
    </form>
  );
}
