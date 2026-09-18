"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
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
import { METODOS_PAGO } from "@/lib/validation/pago";
import { registrarPago, type PagoFormState } from "./pagos-actions";

const ESTADO_INICIAL: PagoFormState = {};

const METODO_LABEL: Record<(typeof METODOS_PAGO)[number], string> = {
  TRANSFERENCIA: "Transferencia",
  EFECTIVO: "Efectivo",
  OTRO: "Otro",
};

function BotonRegistrar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      <Plus data-icon="inline-start" className="size-4" />
      {pending ? "Registrando..." : "Registrar pago"}
    </Button>
  );
}

export function PagoForm({ contratoId }: { contratoId: string }) {
  const action = registrarPago.bind(null, contratoId);
  const [state, formAction] = useActionState(action, ESTADO_INICIAL);

  return (
    <form action={formAction} className="flex flex-col gap-3 border-t border-border pt-4">
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="fecha">Fecha</Label>
          <Input id="fecha" name="fecha" type="date" required />
          <FormFieldError mensajes={state.fieldErrors?.fecha} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="monto">Monto (COP)</Label>
          <Input id="monto" name="monto" type="number" required />
          <FormFieldError mensajes={state.fieldErrors?.monto} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="metodo">Método</Label>
          <Select name="metodo" defaultValue="TRANSFERENCIA">
            <SelectTrigger id="metodo" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METODOS_PAGO.map((metodo) => (
                <SelectItem key={metodo} value={metodo}>
                  {METODO_LABEL[metodo]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormFieldError mensajes={state.fieldErrors?.metodo} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="referencia">Referencia</Label>
          <Input id="referencia" name="referencia" />
          <FormFieldError mensajes={state.fieldErrors?.referencia} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="notas">Notas</Label>
        <Textarea id="notas" name="notas" rows={2} />
        <FormFieldError mensajes={state.fieldErrors?.notas} />
      </div>

      <div>
        <BotonRegistrar />
      </div>
    </form>
  );
}
