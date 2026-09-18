"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { PencilLine, StickyNote } from "lucide-react";
import { formatCOP } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormFieldError } from "@/components/form-field-error";
import { crearNotaContrato, type NotaFormState } from "@/app/(dashboard)/contratos/notas-actions";

const ESTADO_INICIAL: NotaFormState = {};

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Guardando..." : "Agregar nota"}
    </Button>
  );
}

export type NotaContratoItem = {
  id: string;
  contenido: string;
  createdAt: string;
  pago: { fecha: string; monto: number } | null;
};

export function TabNotas({ contratoId, notas }: { contratoId: string; notas: NotaContratoItem[] }) {
  const action = crearNotaContrato.bind(null, contratoId);
  const [state, formAction] = useActionState(action, ESTADO_INICIAL);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.error && !state.fieldErrors) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div className="flex flex-col gap-4">
      <form ref={formRef} action={formAction} className="flex flex-col gap-2">
        <Textarea name="contenido" placeholder="Escribe una nota de seguimiento sobre este contrato..." rows={3} />
        <FormFieldError mensajes={state.fieldErrors?.contenido} />
        <div>
          <BotonGuardar />
        </div>
      </form>

      {notas.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Todavía no hay notas de seguimiento.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {notas.map((nota) => (
            <div key={nota.id} className="flex gap-3 rounded-lg border border-border p-3">
              <span
                className={
                  nota.pago
                    ? "flex size-7 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning"
                    : "flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
                }
              >
                {nota.pago ? <PencilLine className="size-3.5" /> : <StickyNote className="size-3.5" />}
              </span>
              <div className="min-w-0 flex-1">
                {nota.pago && (
                  <p className="mb-1 text-xs font-medium text-warning">
                    Corrección del pago del {nota.pago.fecha} — {formatCOP(nota.pago.monto)}
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap text-foreground">{nota.contenido}</p>
                <p className="mt-1 text-xs text-muted-foreground">{nota.createdAt}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
