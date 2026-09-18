"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { StickyNote } from "lucide-react";
import { formatCOP } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FormFieldError } from "@/components/form-field-error";
import { crearNotaCorreccionPago, type NotaFormState } from "@/app/(dashboard)/contratos/notas-actions";

const ESTADO_INICIAL: NotaFormState = {};

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Guardando..." : "Guardar corrección"}
    </Button>
  );
}

function NotaCorreccionForm({
  contratoId,
  pagoId,
  onSuccess,
}: {
  contratoId: string;
  pagoId: string;
  onSuccess: () => void;
}) {
  const action = crearNotaCorreccionPago.bind(null, contratoId, pagoId);
  const [state, formAction] = useActionState(action, ESTADO_INICIAL);

  useEffect(() => {
    if (state.ok) {
      toast.success("Corrección guardada.");
      onSuccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Textarea
        name="contenido"
        placeholder="Ej: el monto real fue $450.000, no $500.000. Se registró mal por error de digitación."
        rows={4}
        autoFocus
      />
      <FormFieldError mensajes={state.fieldErrors?.contenido} />
      <div>
        <BotonGuardar />
      </div>
    </form>
  );
}

export function NotaCorreccionDialog({
  contratoId,
  pagoId,
  fechaLabel,
  monto,
  trigger,
}: {
  contratoId: string;
  pagoId: string;
  fechaLabel: string;
  monto: number;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="size-4 text-muted-foreground" />
            Anotar corrección
          </DialogTitle>
        </DialogHeader>
        <p className="-mt-2 text-sm text-muted-foreground">
          Pago del {fechaLabel} — {formatCOP(monto)}. El pago no se modifica; esta nota queda como constancia de qué
          pasó realmente y por qué.
        </p>
        <NotaCorreccionForm contratoId={contratoId} pagoId={pagoId} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
