"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { CircleCheck, ChevronRight, HandCoins, Receipt, TriangleAlert, Zap } from "lucide-react";
import { cn } from "cn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogTrigger } from "@/components/ui/dialog";
import { RegistrarPagoDialog } from "@/components/contratos/registrar-pago-dialog";
import type { MetodoPagoOpcion } from "@/app/(dashboard)/contratos/pago-form";
import { CerrarPeriodoDialog } from "@/components/contratos/cerrar-periodo-dialog";
import { MarcarIncumplidoDialog } from "@/components/contratos/marcar-incumplido-dialog";
import { compraAnticipadaAction, type AccionCierreState } from "@/app/(dashboard)/contratos/cierre-actions";

const ESTADO_INICIAL: AccionCierreState = {};

function FilaLink({
  href,
  icono: Icono,
  etiqueta,
  destacado,
  tono,
}: {
  href: string;
  icono: typeof Zap;
  etiqueta: string;
  destacado?: boolean;
  tono?: "warning" | "success" | "destructive";
}) {
  const colorIcono =
    tono === "warning"
      ? "text-warning"
      : tono === "success"
        ? "text-success"
        : tono === "destructive"
          ? "text-destructive"
          : "text-muted-foreground";

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-foreground hover:bg-muted",
        destacado && "bg-primary/10 hover:bg-primary/15",
      )}
    >
      <Icono className={cn("size-4 shrink-0", destacado ? "text-primary" : colorIcono)} />
      <span className="flex-1 truncate">{etiqueta}</span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function FilaAccion({
  action,
  icono: Icono,
  etiqueta,
  etiquetaPendiente,
  confirmacion,
  tono,
}: {
  action: (state: AccionCierreState, formData: FormData) => Promise<AccionCierreState>;
  icono: typeof Zap;
  etiqueta: string;
  etiquetaPendiente: string;
  confirmacion: string;
  tono?: "warning" | "success" | "destructive";
}) {
  const [state, formAction, pending] = useActionState(action, ESTADO_INICIAL);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  const colorIcono =
    tono === "warning"
      ? "text-warning"
      : tono === "success"
        ? "text-success"
        : tono === "destructive"
          ? "text-destructive"
          : "text-muted-foreground";

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!confirm(confirmacion)) event.preventDefault();
      }}
    >
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
      >
        <Icono className={cn("size-4 shrink-0", colorIcono)} />
        <span className="flex-1 truncate">{pending ? etiquetaPendiente : etiqueta}</span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </button>
    </form>
  );
}

export function AccionesRapidas({
  contratoId,
  activo,
  ultimoPeriodoId,
  saldoCapitalPendiente,
  arriendoFijoMensual,
  moraAcumulada,
  cobradoPeriodo,
  metodosPago,
}: {
  contratoId: string;
  activo: boolean;
  ultimoPeriodoId?: string;
  saldoCapitalPendiente: number;
  arriendoFijoMensual: number;
  moraAcumulada: number;
  cobradoPeriodo: number;
  metodosPago: MetodoPagoOpcion[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="size-4 text-primary" />
          Acciones rápidas
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-0.5">
        {activo && (
          <RegistrarPagoDialog
            contratoId={contratoId}
            saldoCapitalPendiente={saldoCapitalPendiente}
            metodosPago={metodosPago}
            trigger={
              <DialogTrigger className="flex items-center gap-2.5 rounded-lg bg-primary/10 px-2.5 py-2 text-left text-sm font-medium text-foreground hover:bg-primary/15">
                <Receipt className="size-4 shrink-0 text-primary" />
                <span className="flex-1 truncate">Registrar pago</span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </DialogTrigger>
            }
          />
        )}

        {activo && (
          <CerrarPeriodoDialog
            contratoId={contratoId}
            arriendoFijoMensual={arriendoFijoMensual}
            moraAcumulada={moraAcumulada}
            cobradoPeriodo={cobradoPeriodo}
            saldoCapitalPendiente={saldoCapitalPendiente}
            trigger={
              <DialogTrigger className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-foreground hover:bg-muted">
                <CircleCheck className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">Cerrar periodo</span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </DialogTrigger>
            }
          />
        )}

        {ultimoPeriodoId ? (
          <FilaLink href={`/api/recibos/${ultimoPeriodoId}`} icono={Receipt} etiqueta="Generar recibo" />
        ) : null}

        {activo && (
          <MarcarIncumplidoDialog
            contratoId={contratoId}
            arriendoFijoMensual={arriendoFijoMensual}
            moraAcumulada={moraAcumulada}
            cobradoPeriodo={cobradoPeriodo}
            saldoCapitalPendiente={saldoCapitalPendiente}
            trigger={
              <DialogTrigger className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-foreground hover:bg-muted">
                <TriangleAlert className="size-4 shrink-0 text-destructive" />
                <span className="flex-1 truncate">Marcar como incumplido</span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </DialogTrigger>
            }
          />
        )}

        {activo && (
          <FilaAccion
            action={compraAnticipadaAction.bind(null, contratoId)}
            icono={HandCoins}
            etiqueta="Compra anticipada (finalizar)"
            etiquetaPendiente="Procesando..."
            confirmacion="¿Registrar la compra anticipada? Se exige que lo cobrado cubra el arriendo del periodo más todo el saldo de capital pendiente."
            tono="success"
          />
        )}
      </CardContent>
    </Card>
  );
}
