"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { eliminarPago, type EliminarPagoResultado } from "./pagos-actions";

const ESTADO_INICIAL: EliminarPagoResultado = {};

export function EliminarPagoButton({ pagoId }: { pagoId: string }) {
  const accionConId = eliminarPago.bind(null, pagoId);
  const [state, formAction, pending] = useActionState(accionConId, ESTADO_INICIAL);

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state.error]);

  return (
    <form action={formAction}>
      <Button
        type="submit"
        variant="ghost"
        size="icon-sm"
        disabled={pending}
        aria-label="Eliminar pago"
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </Button>
    </form>
  );
}
