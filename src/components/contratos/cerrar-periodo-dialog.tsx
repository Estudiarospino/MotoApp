"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ResumenCierreCampos, type DatosCierre } from "@/components/contratos/cierre-preview";
import { cerrarPeriodoAction, type AccionCierreState } from "@/app/(dashboard)/contratos/cierre-actions";

const ESTADO_INICIAL: AccionCierreState = {};

function BotonConfirmar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Cerrando..." : "Confirmar cierre"}
    </Button>
  );
}

function CerrarPeriodoForm({
  contratoId,
  arriendoFijoMensual,
  moraAcumulada,
  cobradoPeriodo,
  saldoCapitalPendiente,
  onSuccess,
}: DatosCierre & { onSuccess: () => void }) {
  const [arriendoTexto, setArriendoTexto] = useState(arriendoFijoMensual.toString());
  const action = cerrarPeriodoAction.bind(null, contratoId);
  const [state, formAction] = useActionState(action, ESTADO_INICIAL);

  useEffect(() => {
    if (state.ok) {
      toast.success("Periodo cerrado correctamente.");
      onSuccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
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
        mensajeFinalizado="Este cierre agota el saldo de capital: el contrato quedará finalizado."
      />

      <div className="flex justify-end">
        <BotonConfirmar />
      </div>
    </form>
  );
}

export function CerrarPeriodoDialog({
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
          <DialogTitle>Cerrar periodo</DialogTitle>
        </DialogHeader>
        <CerrarPeriodoForm
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
