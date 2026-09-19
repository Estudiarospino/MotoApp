"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRightLeft } from "lucide-react";
import { formatCOP } from "@/lib/money";
import { formatFolioContrato } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormFieldError } from "@/components/form-field-error";
import { transferirACapitalAction, type TransferenciaFormState } from "./actions";

const ESTADO_INICIAL: TransferenciaFormState = {};

type ContratoOpcion = { id: string; folio: number };

function BotonTransferir() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="secondary" disabled={pending}>
      <ArrowRightLeft data-icon="inline-start" className="size-4" />
      {pending ? "Transfiriendo..." : "Transferir a capital"}
    </Button>
  );
}

export function TransferenciaCapitalForm({
  prestamoId,
  saldoPendiente,
  contratos,
  contratoIdInicial,
  onSuccess,
}: {
  prestamoId: string;
  saldoPendiente: number;
  contratos: ContratoOpcion[];
  contratoIdInicial?: string;
  onSuccess?: () => void;
}) {
  const action = transferirACapitalAction.bind(null, prestamoId);
  const [state, formAction] = useActionState(action, ESTADO_INICIAL);

  useEffect(() => {
    if (state.ok) {
      onSuccess?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-3 border-t border-border pt-4">
      <p className="text-sm font-medium text-foreground">Transferir a capital de un contrato</p>
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex flex-col gap-1">
        <Label htmlFor="contratoId">Contrato</Label>
        <Select name="contratoId" defaultValue={contratoIdInicial}>
          <SelectTrigger id="contratoId" className="w-full">
            <SelectValue placeholder="Selecciona un contrato activo">
              {(v: string) => {
                const contrato = contratos.find((c) => c.id === v);
                return contrato ? formatFolioContrato(contrato.folio) : v;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {contratos.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {formatFolioContrato(c.folio)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormFieldError mensajes={state.fieldErrors?.contratoId} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="fechaTransferencia">Fecha</Label>
          <Input id="fechaTransferencia" name="fecha" type="date" required />
          <FormFieldError mensajes={state.fieldErrors?.fecha} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="montoTransferencia">Monto (COP)</Label>
          <Input id="montoTransferencia" name="monto" type="number" max={saldoPendiente} required />
          <p className="text-xs text-muted-foreground">Saldo disponible: {formatCOP(saldoPendiente)}.</p>
          <FormFieldError mensajes={state.fieldErrors?.monto} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="notasTransferencia">Nota</Label>
        <Textarea id="notasTransferencia" name="notas" rows={2} placeholder="Opcional" />
        <FormFieldError mensajes={state.fieldErrors?.notas} />
      </div>

      <p className="text-xs text-muted-foreground">
        No entra dinero nuevo: el saldo del préstamo baja y el capital pendiente del contrato sube en la misma
        cantidad, quedando registrado como el origen de ese aumento.
      </p>

      <div>
        <BotonTransferir />
      </div>
    </form>
  );
}
