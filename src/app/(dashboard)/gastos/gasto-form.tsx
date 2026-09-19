"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Banknote, FileText, Save, X } from "lucide-react";
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
      <Save data-icon="inline-start" className="size-4" />
      {pending ? "Guardando..." : "Guardar"}
    </Button>
  );
}

export function GastoForm({
  action,
  motos,
  valoresIniciales,
  motocicletaIdInicial,
  onSuccess,
  onCancel,
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
  motocicletaIdInicial?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [state, formAction] = useActionState(action, ESTADO_INICIAL);

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
        <Label htmlFor="motocicletaId">Motocicleta</Label>
        <Select name="motocicletaId" defaultValue={valoresIniciales?.motocicletaId ?? motocicletaIdInicial}>
          <SelectTrigger id="motocicletaId" className="w-full">
            <SelectValue placeholder="Selecciona una moto">
              {(v: string) => {
                const moto = motos.find((m) => m.id === v);
                return moto ? `${moto.placa} — ${moto.marca} ${moto.modelo}` : v;
              }}
            </SelectValue>
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
              <SelectValue>{(v: (typeof CATEGORIAS_GASTO)[number]) => CATEGORIA_LABEL[v] ?? v}</SelectValue>
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
        <div className="relative">
          <FileText className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="descripcion"
            name="descripcion"
            placeholder="Ej. Cambio de aceite y filtro"
            defaultValue={valoresIniciales?.descripcion}
            className="pl-8"
            required
          />
        </div>
        <FormFieldError mensajes={state.fieldErrors?.descripcion} />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="monto">Monto (COP)</Label>
        <div className="relative">
          <Banknote className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="monto"
            name="monto"
            type="number"
            defaultValue={valoresIniciales?.monto}
            className="pl-8"
            required
          />
        </div>
        <FormFieldError mensajes={state.fieldErrors?.monto} />
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
