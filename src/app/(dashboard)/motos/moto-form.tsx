"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Bike, Camera } from "lucide-react";
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
    fotoUrl?: string;
  };
}) {
  const [state, formAction] = useActionState(action, ESTADO_INICIAL);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}

      <FotoInput fotoActualUrl={valoresIniciales?.fotoUrl} />

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
