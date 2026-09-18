"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ResumenCierreCampos, type DatosCierre } from "@/components/contratos/cierre-preview";
import { marcarIncumplimientoAction, type AccionCierreState } from "@/app/(dashboard)/contratos/cierre-actions";

const ESTADO_INICIAL: AccionCierreState = {};

function BotonConfirmar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? "Procesando..." : "Marcar como incumplido"}
    </Button>
  );
}

function MarcarIncumplidoForm({
  contratoId,
  arriendoFijoMensual,
  moraAcumulada,
  cobradoPeriodo,
  saldoCapitalPendiente,
  onSuccess,
}: DatosCierre & { onSuccess: () => void }) {
  const [arriendoTexto, setArriendoTexto] = useState(arriendoFijoMensual.toString());
  const action = marcarIncumplimientoAction.bind(null, contratoId);
  const [state, formAction] = useActionState(action, ESTADO_INICIAL);

  useEffect(() => {
    if (state.ok) {
      toast.success("Contrato marcado como incumplido.");
      onSuccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" />
        Esto cierra el periodo abierto con lo cobrado hasta ahora, finaliza el contrato como incumplido y la moto
        vuelve a estar disponible para arrendar. No se puede deshacer.
      </p>

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}

      <ResumenCierreCampos
        arriendoFijoMensual={arriendoFijoMensual}
        moraAcumulada={moraAcumulada}
        cobradoPeriodo={cobradoPeriodo}
        saldoCapitalPendiente={saldoCapitalPendiente}
        arriendoTexto={arriendoTexto}
        onArriendoTextoChange={setArriendoTexto}
        mensajeFinalizado="Este cierre agota el saldo de capital justo al marcar el incumplimiento."
      />

      <div className="flex justify-end">
        <BotonConfirmar />
      </div>
    </form>
  );
}

export function MarcarIncumplidoDialog({
  contratoId,
  arriendoFijoMensual,
  moraAcumulada,
  cobradoPeriodo,
  saldoCapitalPendiente,
  trigger,
}: DatosCierre & { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar contrato como incumplido</DialogTitle>
        </DialogHeader>
        <MarcarIncumplidoForm
          contratoId={contratoId}
          arriendoFijoMensual={arriendoFijoMensual}
          moraAcumulada={moraAcumulada}
          cobradoPeriodo={cobradoPeriodo}
          saldoCapitalPendiente={saldoCapitalPendiente}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
