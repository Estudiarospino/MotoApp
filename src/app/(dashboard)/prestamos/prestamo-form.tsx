"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Banknote, ClipboardList, Save, X } from "lucide-react";
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
import { formatFolioContrato } from "@/lib/format";
import { createPrestamo, type PrestamoFormState } from "./actions";

const ESTADO_INICIAL: PrestamoFormState = {};

export type ContratoParaPrestamo = { id: string; folio: number; clienteNombre: string; motoNombre: string };

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
  contratos,
  contratoIdInicial,
  onSuccess,
  onCancel,
}: {
  contratos: ContratoParaPrestamo[];
  contratoIdInicial?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [state, formAction] = useActionState(createPrestamo, ESTADO_INICIAL);
  const contratoFijo = contratoIdInicial ? contratos.find((c) => c.id === contratoIdInicial) : undefined;

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
        <Label htmlFor="contratoId">Contrato</Label>
        {contratoFijo ? (
          <>
            <p className="flex h-8 items-center rounded-lg border border-input bg-muted/50 px-2.5 text-sm text-foreground">
              {formatFolioContrato(contratoFijo.folio)} — {contratoFijo.clienteNombre} · {contratoFijo.motoNombre}
            </p>
            <input type="hidden" name="contratoId" value={contratoFijo.id} />
          </>
        ) : (
          <>
            <Select name="contratoId">
              <SelectTrigger id="contratoId" className="w-full">
                <SelectValue placeholder="Selecciona un contrato activo">
                  {(v: string) => {
                    const contrato = contratos.find((c) => c.id === v);
                    return contrato
                      ? `${formatFolioContrato(contrato.folio)} — ${contrato.clienteNombre} · ${contrato.motoNombre}`
                      : v;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {contratos.map((contrato) => (
                  <SelectItem key={contrato.id} value={contrato.id}>
                    <ClipboardList className="size-3.5 text-muted-foreground" />
                    {contrato.clienteNombre} — {contrato.motoNombre} ({formatFolioContrato(contrato.folio)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Solo se puede prestar a clientes con un contrato activo — la moto se toma de ese contrato.
            </p>
          </>
        )}
        <FormFieldError mensajes={state.fieldErrors?.contratoId} />
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
