"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Paperclip, Plus } from "lucide-react";
import { formatCOP } from "@/lib/money";
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
import { TIPOS_PAGO } from "@/lib/validation/pago";
import { registrarPago, type PagoFormState } from "./pagos-actions";

const ESTADO_INICIAL: PagoFormState = {};

function formatMiles(valor: string): string {
  const digitos = valor.replace(/\D/g, "");
  if (!digitos) return "";
  return Number(digitos).toLocaleString("es-CO");
}

const TIPO_LABEL: Record<(typeof TIPOS_PAGO)[number], string> = {
  ARRIENDO: "Arriendo",
  ABONO_CAPITAL: "Abono a capital",
};

export type MetodoPagoOpcion = { id: string; nombre: string };

function BotonRegistrar({ tipo }: { tipo: (typeof TIPOS_PAGO)[number] }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      <Plus data-icon="inline-start" className="size-4" />
      {pending ? "Registrando..." : tipo === "ABONO_CAPITAL" ? "Registrar abono" : "Registrar pago"}
    </Button>
  );
}

export function PagoForm({
  contratoId,
  saldoCapitalPendiente,
  metodosPago,
  onSuccess,
}: {
  contratoId: string;
  saldoCapitalPendiente: number;
  metodosPago: MetodoPagoOpcion[];
  onSuccess?: () => void;
}) {
  const action = registrarPago.bind(null, contratoId);
  const [state, formAction] = useActionState(action, ESTADO_INICIAL);
  const formRef = useRef<HTMLFormElement>(null);
  const [tipo, setTipo] = useState<(typeof TIPOS_PAGO)[number]>("ARRIENDO");
  const [montoDisplay, setMontoDisplay] = useState("");
  const montoRaw = montoDisplay.replace(/\D/g, "");

  useEffect(() => {
    if (state.ok) {
      toast.success(tipo === "ABONO_CAPITAL" ? "Abono a capital registrado correctamente." : "Pago registrado correctamente.");
      formRef.current?.reset();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza el input formateado con el reset nativo del form
      setMontoDisplay("");
      onSuccess?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3 border-t border-border pt-4">
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex flex-col gap-1">
        <Label htmlFor="tipo">Tipo de pago</Label>
        <Select name="tipo" value={tipo} onValueChange={(v) => setTipo(v as (typeof TIPOS_PAGO)[number])}>
          <SelectTrigger id="tipo" className="w-full">
            <SelectValue>{(v: string) => TIPO_LABEL[v as (typeof TIPOS_PAGO)[number]] ?? v}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {TIPOS_PAGO.map((t) => (
              <SelectItem key={t} value={t}>
                {TIPO_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {tipo === "ABONO_CAPITAL" && (
          <p className="text-xs text-muted-foreground">
            Se aplica de inmediato al saldo de capital, sin esperar al cierre del periodo. Saldo pendiente:{" "}
            <span className="font-medium text-foreground">{formatCOP(saldoCapitalPendiente)}</span>.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="monto">Monto (COP)</Label>
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
            $
          </span>
          <Input
            id="monto"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            required
            autoFocus
            placeholder="0"
            value={montoDisplay}
            onChange={(e) => setMontoDisplay(formatMiles(e.target.value))}
            aria-invalid={state.fieldErrors?.monto ? true : undefined}
            className="h-12 pl-7 text-xl font-semibold tabular-nums sm:text-2xl"
          />
        </div>
        <input type="hidden" name="monto" value={montoRaw} />
        <FormFieldError mensajes={state.fieldErrors?.monto} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="fecha">Fecha</Label>
          <Input id="fecha" name="fecha" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
          <FormFieldError mensajes={state.fieldErrors?.fecha} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="metodoPagoId">Método</Label>
          <Select name="metodoPagoId" defaultValue={metodosPago[0]?.id}>
            <SelectTrigger id="metodoPagoId" className="w-full">
              <SelectValue placeholder="Selecciona un método">
                {(v: string) => metodosPago.find((m) => m.id === v)?.nombre ?? v}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {metodosPago.map((metodo) => (
                <SelectItem key={metodo.id} value={metodo.id}>
                  {metodo.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormFieldError mensajes={state.fieldErrors?.metodoPagoId} />
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
        <BotonRegistrar tipo={tipo} />
      </div>
    </form>
  );
}
