import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ContratoForm } from "@/app/(dashboard)/contratos/contrato-form";
import { updateContrato } from "@/app/(dashboard)/contratos/actions";

export function EditarContratoDialog({
  contratoId,
  valoresIniciales,
  trigger,
}: {
  contratoId: string;
  valoresIniciales: {
    arriendoFijoMensual: string;
    metaMensualReferencia?: string;
    cuotaDiariaReferencia?: string;
    frecuenciaPago?: string;
    fechaFinEstimada?: string;
  };
  trigger: React.ReactNode;
}) {
  const actionConId = updateContrato.bind(null, contratoId);

  return (
    <Dialog>
      {trigger}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar términos del contrato</DialogTitle>
        </DialogHeader>
        <ContratoForm modo="editar" action={actionConId} valoresIniciales={valoresIniciales} />
      </DialogContent>
    </Dialog>
  );
}
