"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Bike, PencilLine, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormFieldError } from "@/components/form-field-error";
import { toFechaInputValue } from "@/lib/format";
import { SIN_SELECCION } from "@/lib/validation/prestamo";
import { updatePrestamo, type PrestamoFormState } from "./actions";

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

function EditarPrestamoForm({
  prestamo,
  motos,
  onSuccess,
  onCancel,
}: {
  prestamo: { id: string; fecha: Date; motocicletaId: string | null; motivo: string | null };
  motos: { id: string; placa: string; marca: string; modelo: string }[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const action = updatePrestamo.bind(null, prestamo.id);
  const [state, formAction] = useActionState(action, ESTADO_INICIAL);

  useEffect(() => {
    if (state.ok) {
      onSuccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex flex-col gap-1">
        <Label htmlFor="fecha">Fecha</Label>
        <Input id="fecha" name="fecha" type="date" defaultValue={toFechaInputValue(prestamo.fecha)} required />
        <FormFieldError mensajes={state.fieldErrors?.fecha} />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="motocicletaId">Motocicleta relacionada (opcional)</Label>
        <Select name="motocicletaId" defaultValue={prestamo.motocicletaId ?? SIN_SELECCION}>
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
        <Textarea id="motivo" name="motivo" defaultValue={prestamo.motivo ?? undefined} rows={2} />
        <FormFieldError mensajes={state.fieldErrors?.motivo} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X data-icon="inline-start" className="size-4" />
          Cancelar
        </Button>
        <BotonGuardar />
      </div>
    </form>
  );
}

export function EditarPrestamoDialog({
  prestamo,
  motos,
}: {
  prestamo: { id: string; fecha: Date; motocicletaId: string | null; motivo: string | null };
  motos: { id: string; placa: string; marca: string; modelo: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-1.5 rounded-lg border border-input px-2.5 py-1.5 text-sm font-medium hover:bg-muted">
        <PencilLine className="size-4" />
        Editar
      </DialogTrigger>
      <DialogContent>
        <div className="flex items-start gap-3 pr-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <PencilLine className="size-5" />
          </span>
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-semibold text-foreground">Editar préstamo</h2>
            <p className="text-sm text-muted-foreground">
              El monto original no se puede cambiar aquí; usa los abonos para ajustar el saldo.
            </p>
          </div>
        </div>

        <EditarPrestamoForm
          prestamo={prestamo}
          motos={motos}
          onSuccess={() => {
            toast.success("Préstamo actualizado.");
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
