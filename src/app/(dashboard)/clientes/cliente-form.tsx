"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Hash, Mail, MapPin, Phone, Save, User, X } from "lucide-react";
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
const NOTAS_MAX = 500;

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Save data-icon="inline-start" className="size-4" />
      {pending ? "Guardando..." : "Guardar"}
    </Button>
  );
}

export function ClienteForm({
  action,
  valoresIniciales,
  onSuccess,
  onCancel,
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
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [state, formAction] = useActionState(action, ESTADO_INICIAL);
  const [notas, setNotas] = useState(valoresIniciales?.notas ?? "");

  useEffect(() => {
    if (state.ok) {
      onSuccess?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex flex-col gap-1">
        <Label htmlFor="nombreCompleto">Nombre completo</Label>
        <div className="relative">
          <User className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="nombreCompleto"
            name="nombreCompleto"
            placeholder="Ej. Juan Carlos Pérez"
            defaultValue={valoresIniciales?.nombreCompleto}
            className="pl-8"
            required
          />
        </div>
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
          <div className="relative">
            <Hash className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="numeroIdentificacion"
              name="numeroIdentificacion"
              placeholder="Ej. 1234567890"
              defaultValue={valoresIniciales?.numeroIdentificacion}
              className="pl-8"
              required
            />
          </div>
          <FormFieldError mensajes={state.fieldErrors?.numeroIdentificacion} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="telefono">Teléfono</Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="telefono"
              name="telefono"
              placeholder="Ej. 300 123 4567"
              defaultValue={valoresIniciales?.telefono}
              className="pl-8"
            />
          </div>
          <FormFieldError mensajes={state.fieldErrors?.telefono} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="email">Correo</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Ej. juan@email.com"
              defaultValue={valoresIniciales?.email}
              className="pl-8"
            />
          </div>
          <FormFieldError mensajes={state.fieldErrors?.email} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="direccion">Dirección</Label>
        <div className="relative">
          <MapPin className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="direccion"
            name="direccion"
            placeholder="Ej. Calle 12 # 34 - 56, Santa Marta"
            defaultValue={valoresIniciales?.direccion}
            className="pl-8"
          />
        </div>
        <FormFieldError mensajes={state.fieldErrors?.direccion} />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="notas">Notas</Label>
        <Textarea
          id="notas"
          name="notas"
          placeholder="Información adicional sobre el cliente..."
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          maxLength={NOTAS_MAX}
          rows={3}
        />
        <div className="flex items-center justify-between">
          <FormFieldError mensajes={state.fieldErrors?.notas} />
          <span className="ml-auto text-xs text-muted-foreground">
            {notas.length}/{NOTAS_MAX}
          </span>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            <X data-icon="inline-start" className="size-4" />
            Cancelar
          </Button>
        )}
        <BotonGuardar />
      </div>
    </form>
  );
}
