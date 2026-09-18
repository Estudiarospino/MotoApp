"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Paperclip, Plus } from "lucide-react";
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

export function PagoForm({ contratoId, onSuccess }: { contratoId: string; onSuccess?: () => void }) {
  const action = registrarPago.bind(null, contratoId);
  const [state, formAction] = useActionState(action, ESTADO_INICIAL);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success("Pago registrado correctamente.");
      formRef.current?.reset();
      onSuccess?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3 border-t border-border pt-4">
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="fecha">Fecha</Label>
          <Input id="fecha" name="fecha" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
          <FormFieldError mensajes={state.fieldErrors?.fecha} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="monto">Monto (COP)</Label>
          <Input id="monto" name="monto" type="number" required autoFocus />
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
        <Label htmlFor="notas">Nota o descripción</Label>
        <Textarea id="notas" name="notas" rows={2} placeholder="Opcional" />
        <FormFieldError mensajes={state.fieldErrors?.notas} />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="comprobante" className="flex items-center gap-1.5">
          <Paperclip className="size-3.5 text-muted-foreground" />
          Comprobante
        </Label>
        <input
          id="comprobante"
          name="comprobante"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-2.5 file:py-1 file:text-sm"
        />
        <p className="text-xs text-muted-foreground">Opcional. JPG, PNG, WEBP o PDF, máx. 5MB.</p>
        <FormFieldError mensajes={state.fieldErrors?.comprobante} />
      </div>

      <div>
        <BotonRegistrar />
      </div>
    </form>
  );
}
