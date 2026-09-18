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
import { TIPOS_IDENTIFICACION } from "@/lib/validation/cliente";
import type { ClienteFormState } from "./actions";

const ESTADO_INICIAL: ClienteFormState = {};

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando..." : "Guardar"}
    </Button>
  );
}

export function ClienteForm({
  action,
  valoresIniciales,
}: {
  action: (state: ClienteFormState, formData: FormData) => Promise<ClienteFormState>;
  valoresIniciales?: {
    nombreCompleto?: string;
    tipoIdentificacion?: string;
    numeroIdentificacion?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    notas?: string;
  };
}) {
  const [state, formAction] = useActionState(action, ESTADO_INICIAL);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex flex-col gap-1">
        <Label htmlFor="nombreCompleto">Nombre completo</Label>
        <Input
          id="nombreCompleto"
          name="nombreCompleto"
          defaultValue={valoresIniciales?.nombreCompleto}
          required
        />
        <FormFieldError mensajes={state.fieldErrors?.nombreCompleto} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="tipoIdentificacion">Tipo de identificación</Label>
          <Select name="tipoIdentificacion" defaultValue={valoresIniciales?.tipoIdentificacion ?? "CC"}>
            <SelectTrigger id="tipoIdentificacion" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_IDENTIFICACION.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormFieldError mensajes={state.fieldErrors?.tipoIdentificacion} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="numeroIdentificacion">Número de identificación</Label>
          <Input
            id="numeroIdentificacion"
            name="numeroIdentificacion"
            defaultValue={valoresIniciales?.numeroIdentificacion}
            required
          />
          <FormFieldError mensajes={state.fieldErrors?.numeroIdentificacion} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" name="telefono" defaultValue={valoresIniciales?.telefono} />
          <FormFieldError mensajes={state.fieldErrors?.telefono} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="email">Correo</Label>
          <Input id="email" name="email" type="email" defaultValue={valoresIniciales?.email} />
          <FormFieldError mensajes={state.fieldErrors?.email} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="direccion">Dirección</Label>
        <Input id="direccion" name="direccion" defaultValue={valoresIniciales?.direccion} />
        <FormFieldError mensajes={state.fieldErrors?.direccion} />
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
