"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Save, StickyNote, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormFieldError } from "@/components/form-field-error";
import { crearNotaPrestamo, type NotaFormState } from "./notas-actions";

const ESTADO_INICIAL: NotaFormState = {};

function BotonGuardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Save data-icon="inline-start" className="size-4" />
      {pending ? "Guardando..." : "Guardar nota"}
    </Button>
  );
}

function NotaForm({ prestamoId, onSuccess, onCancel }: { prestamoId: string; onSuccess: () => void; onCancel: () => void }) {
  const action = crearNotaPrestamo.bind(null, prestamoId);
  const [state, formAction] = useActionState(action, ESTADO_INICIAL);

  useEffect(() => {
    if (state.ok) {
      onSuccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Textarea
          name="contenido"
          placeholder="Ej. El cliente acordó pagar el saldo restante en efectivo el 30..."
          rows={4}
          autoFocus
        />
        <FormFieldError mensajes={state.fieldErrors?.contenido} />
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

export function NotaDialog({ prestamoId, trigger }: { prestamoId: string; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent>
        <div className="flex items-start gap-3 pr-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <StickyNote className="size-5" />
          </span>
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-semibold text-foreground">Agregar nota</h2>
            <p className="text-sm text-muted-foreground">Deja un recordatorio o acuerdo sobre este préstamo.</p>
          </div>
        </div>

        <NotaForm
          prestamoId={prestamoId}
          onSuccess={() => {
            toast.success("Nota agregada.");
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
