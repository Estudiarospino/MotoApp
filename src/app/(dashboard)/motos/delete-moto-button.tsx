"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteMotocicletaSiNoTieneHistorial, type EliminarMotoResultado } from "./actions";

const ESTADO_INICIAL: EliminarMotoResultado = {};

export function DeleteMotoButton({ motoId }: { motoId: string }) {
  const accionConId = deleteMotocicletaSiNoTieneHistorial.bind(null, motoId);
  const [state, formAction, pending] = useActionState(accionConId, ESTADO_INICIAL);

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state.error]);

  return (
    <form action={formAction}>
      <Button type="submit" variant="ghost" size="sm" disabled={pending}>
        Eliminar
      </Button>
    </form>
  );
}
