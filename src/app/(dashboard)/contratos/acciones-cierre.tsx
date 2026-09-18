"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { CircleCheck, HandCoins, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  cerrarPeriodoAction,
  compraAnticipadaAction,
  marcarIncumplimientoAction,
  type AccionCierreState,
} from "./cierre-actions";

const ESTADO_INICIAL: AccionCierreState = {};

function BotonAccion({
  action,
  etiqueta,
  etiquetaPendiente,
  confirmacion,
  variant,
  icono: Icono,
}: {
  action: (state: AccionCierreState, formData: FormData) => Promise<AccionCierreState>;
  etiqueta: string;
  etiquetaPendiente: string;
  confirmacion: string;
  variant?: "default" | "outline" | "destructive";
  icono: typeof CircleCheck;
}) {
  const [state, formAction, pending] = useActionState(action, ESTADO_INICIAL);

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state.error]);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!confirm(confirmacion)) {
          event.preventDefault();
        }
      }}
    >
      <Button type="submit" variant={variant} disabled={pending}>
        <Icono data-icon="inline-start" className="size-4" />
        {pending ? etiquetaPendiente : etiqueta}
      </Button>
    </form>
  );
}

export function AccionesCierre({ contratoId }: { contratoId: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <BotonAccion
        action={cerrarPeriodoAction.bind(null, contratoId)}
        etiqueta="Cerrar periodo"
        etiquetaPendiente="Cerrando..."
        confirmacion="¿Cerrar el periodo abierto con lo cobrado hasta ahora? Esta acción no se puede deshacer."
        icono={CircleCheck}
      />
      <BotonAccion
        action={compraAnticipadaAction.bind(null, contratoId)}
        etiqueta="Compra anticipada"
        etiquetaPendiente="Procesando..."
        confirmacion="¿Registrar la compra anticipada? Se exige que lo cobrado cubra el arriendo del periodo más todo el saldo de capital pendiente."
        variant="outline"
        icono={HandCoins}
      />
      <BotonAccion
        action={marcarIncumplimientoAction.bind(null, contratoId)}
        etiqueta="Marcar incumplimiento"
        etiquetaPendiente="Procesando..."
        confirmacion="¿Marcar este contrato como incumplido? Se cerrará el periodo abierto y la moto volverá a estar disponible. Esta acción no se puede deshacer."
        variant="destructive"
        icono={TriangleAlert}
      />
    </div>
  );
}
