"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormFieldError } from "@/components/form-field-error";
import { CATEGORIAS_GASTO } from "@/lib/validation/gasto";
import type { GastoFormState } from "./actions";

const ESTADO_INICIAL: GastoFormState = {};

const CATEGORIA_LABEL: Record<(typeof CATEGORIAS_GASTO)[number], string> = {
  MANTENIMIENTO: "Mantenimiento",
  REPARACION: "Reparación",
  SEGURO: "Seguro",
  IMPUESTOS: "Impuestos",
  OTRO: "Otro",
};

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando..." : "Guardar"}
    </Button>
  );
}

export function GastoForm({
  action,
  motos,
  valoresIniciales,
}: {
  action: (state: GastoFormState, formData: FormData) => Promise<GastoFormState>;
  motos: { id: string; placa: string; marca: string; modelo: string }[];
  valoresIniciales?: {
    motocicletaId?: string;
    fecha?: string;
    categoria?: string;
    descripcion?: string;
    monto?: string;
  };
}) {
  const [state, formAction] = useActionState(action, ESTADO_INICIAL);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex flex-col gap-1">
        <Label htmlFor="motocicletaId">Motocicleta</Label>
        <Select name="motocicletaId" defaultValue={valoresIniciales?.motocicletaId}>
          <SelectTrigger id="motocicletaId" className="w-full">
            <SelectValue placeholder="Selecciona una moto" />
          </SelectTrigger>
          <SelectContent>
            {motos.map((moto) => (
              <SelectItem key={moto.id} value={moto.id}>
                {moto.placa} — {moto.marca} {moto.modelo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormFieldError mensajes={state.fieldErrors?.motocicletaId} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="fecha">Fecha</Label>
          <Input id="fecha" name="fecha" type="date" defaultValue={valoresIniciales?.fecha} required />
          <FormFieldError mensajes={state.fieldErrors?.fecha} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="categoria">Categoría</Label>
          <Select name="categoria" defaultValue={valoresIniciales?.categoria ?? "MANTENIMIENTO"}>
            <SelectTrigger id="categoria" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIAS_GASTO.map((categoria) => (
                <SelectItem key={categoria} value={categoria}>
                  {CATEGORIA_LABEL[categoria]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormFieldError mensajes={state.fieldErrors?.categoria} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="descripcion">Descripción</Label>
        <Input
          id="descripcion"
          name="descripcion"
          defaultValue={valoresIniciales?.descripcion}
          required
        />
        <FormFieldError mensajes={state.fieldErrors?.descripcion} />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="monto">Monto (COP)</Label>
        <Input
          id="monto"
          name="monto"
          type="number"
          defaultValue={valoresIniciales?.monto}
          required
        />
        <FormFieldError mensajes={state.fieldErrors?.monto} />
      </div>

      <div>
        <BotonGuardar />
      </div>
    </form>
  );
}
