"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Banknote, Bike, Save, User, X } from "lucide-react";
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
import { SIN_SELECCION } from "@/lib/validation/prestamo";
import { createPrestamo, type PrestamoFormState } from "./actions";

const ESTADO_INICIAL: PrestamoFormState = {};

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Save data-icon="inline-start" className="size-4" />
      {pending ? "Guardando..." : "Guardar"}
    </Button>
  );
}

export function PrestamoForm({
  clientes,
  motos,
  onSuccess,
  onCancel,
}: {
  clientes: { id: string; nombreCompleto: string; numeroIdentificacion: string }[];
  motos: { id: string; placa: string; marca: string; modelo: string }[];
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [state, formAction] = useActionState(createPrestamo, ESTADO_INICIAL);

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
        <Label htmlFor="clienteId">Cliente</Label>
        <Select name="clienteId">
          <SelectTrigger id="clienteId" className="w-full">
            <SelectValue placeholder="Selecciona un cliente">
              {(v: string) => {
                const cliente = clientes.find((c) => c.id === v);
                return cliente ? `${cliente.nombreCompleto} — ${cliente.numeroIdentificacion}` : v;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {clientes.map((cliente) => (
              <SelectItem key={cliente.id} value={cliente.id}>
                <User className="size-3.5 text-muted-foreground" />
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
          <div className="relative">
            <Banknote className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="montoOriginal" name="montoOriginal" type="number" className="pl-8" required />
          </div>
          <FormFieldError mensajes={state.fieldErrors?.montoOriginal} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="motocicletaId">Motocicleta relacionada (opcional)</Label>
        <Select name="motocicletaId" defaultValue={SIN_SELECCION}>
          <SelectTrigger id="motocicletaId" className="w-full">
            <SelectValue>
              {(v: string) => {
                if (v === SIN_SELECCION) return "Ninguna";
                const moto = motos.find((m) => m.id === v);
                return moto ? `${moto.placa} — ${moto.marca} ${moto.modelo}` : v;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SIN_SELECCION}>Ninguna</SelectItem>
            {motos.map((moto) => (
              <SelectItem key={moto.id} value={moto.id}>
                <Bike className="size-3.5 text-muted-foreground" />
                {moto.placa} — {moto.marca} {moto.modelo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormFieldError mensajes={state.fieldErrors?.motocicletaId} />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="motivo">Motivo</Label>
        <Textarea id="motivo" name="motivo" placeholder="Ej. Adelanto para repuestos" rows={2} />
        <FormFieldError mensajes={state.fieldErrors?.motivo} />
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
