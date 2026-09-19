"use client";

import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Banknote, Bike, Calendar, Camera, Palette, Save, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormFieldError } from "@/components/form-field-error";
import { formatFecha } from "@/lib/format";
import { calcularVencimiento, VIGENCIA_SOAT_MESES, VIGENCIA_TECNOMECANICA_MESES } from "@/lib/moto-documentos";
import type { MotocicletaFormState } from "./actions";

const ESTADO_INICIAL: MotocicletaFormState = {};

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Save data-icon="inline-start" className="size-4" />
      {pending ? "Guardando..." : "Guardar"}
    </Button>
  );
}

function FotoInput({ fotoActualUrl }: { fotoActualUrl?: string }) {
  const [preview, setPreview] = useState<string | null>(fotoActualUrl ?? null);

  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor="foto">Foto de la moto</Label>
      <div className="flex items-center gap-4">
        <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
          {preview ? (
            <Image src={preview} alt="Vista previa" fill className="object-cover" unoptimized={preview.startsWith("blob:")} />
          ) : (
            <Bike className="size-8 text-muted-foreground" />
          )}
        </div>
        <label
          htmlFor="foto"
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-input px-3 py-1.5 text-sm font-medium hover:bg-muted"
        >
          <Camera className="size-4" />
          {preview ? "Cambiar foto" : "Subir foto"}
        </label>
        <input
          id="foto"
          name="foto"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setPreview(URL.createObjectURL(file));
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground">JPG, PNG o WEBP. Máximo 5MB.</p>
    </div>
  );
}

/** Input de fecha de expedición que muestra en vivo el vencimiento calculado. */
function FechaExpedicionInput({
  id,
  name,
  label,
  defaultValue,
  meses,
  error,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
  meses: number;
  error?: string[];
}) {
  const [fecha, setFecha] = useState(defaultValue ?? "");
  const vencimiento = fecha ? calcularVencimiento(new Date(`${fecha}T00:00:00Z`), meses) : null;

  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type="date"
        defaultValue={defaultValue}
        onChange={(e) => setFecha(e.target.value)}
      />
      <p className="text-xs text-muted-foreground">
        {vencimiento ? `Vence: ${formatFecha(vencimiento)}` : "Sin fecha registrada"}
      </p>
      <FormFieldError mensajes={error} />
    </div>
  );
}

export function MotoForm({
  action,
  valoresIniciales,
  onSuccess,
  onCancel,
}: {
  action: (state: MotocicletaFormState, formData: FormData) => Promise<MotocicletaFormState>;
  valoresIniciales?: {
    marca?: string;
    modelo?: string;
    placa?: string;
    color?: string;
    anioModelo?: string;
    precioInicial?: string;
    soatFechaExpedicion?: string;
    tecnomecanicaFechaExpedicion?: string;
    notas?: string;
    fotoUrl?: string;
  };
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

      <FotoInput fotoActualUrl={valoresIniciales?.fotoUrl} />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="marca">Marca</Label>
          <div className="relative">
            <Tag className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="marca" name="marca" defaultValue={valoresIniciales?.marca} className="pl-8" required />
          </div>
          <FormFieldError mensajes={state.fieldErrors?.marca} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="modelo">Modelo</Label>
          <div className="relative">
            <Bike className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="modelo" name="modelo" defaultValue={valoresIniciales?.modelo} className="pl-8" required />
          </div>
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
          <div className="relative">
            <Calendar className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="anioModelo"
              name="anioModelo"
              type="number"
              defaultValue={valoresIniciales?.anioModelo}
              className="pl-8"
            />
          </div>
          <FormFieldError mensajes={state.fieldErrors?.anioModelo} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="color">Color</Label>
          <div className="relative">
            <Palette className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="color" name="color" defaultValue={valoresIniciales?.color} className="pl-8" />
          </div>
          <FormFieldError mensajes={state.fieldErrors?.color} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="precioInicial">Precio inicial (COP)</Label>
          <div className="relative">
            <Banknote className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="precioInicial"
              name="precioInicial"
              type="number"
              defaultValue={valoresIniciales?.precioInicial}
              className="pl-8"
              required
            />
          </div>
          <FormFieldError mensajes={state.fieldErrors?.precioInicial} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FechaExpedicionInput
          id="soatFechaExpedicion"
          name="soatFechaExpedicion"
          label="Fecha de expedición del SOAT"
          defaultValue={valoresIniciales?.soatFechaExpedicion}
          meses={VIGENCIA_SOAT_MESES}
          error={state.fieldErrors?.soatFechaExpedicion}
        />

        <FechaExpedicionInput
          id="tecnomecanicaFechaExpedicion"
          name="tecnomecanicaFechaExpedicion"
          label="Fecha de expedición de la tecnomecánica"
          defaultValue={valoresIniciales?.tecnomecanicaFechaExpedicion}
          meses={VIGENCIA_TECNOMECANICA_MESES}
          error={state.fieldErrors?.tecnomecanicaFechaExpedicion}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="notas">Notas</Label>
        <Textarea id="notas" name="notas" defaultValue={valoresIniciales?.notas} rows={3} />
        <FormFieldError mensajes={state.fieldErrors?.notas} />
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
