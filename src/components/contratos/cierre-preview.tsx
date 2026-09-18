"use client";

import { CircleCheck } from "lucide-react";
import { cn } from "cn";
import { formatCOP } from "@/lib/money";
import { calcularCierrePeriodo } from "@/server/engine/cierre";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type DatosCierre = {
  contratoId: string;
  arriendoFijoMensual: number;
  moraAcumulada: number;
  cobradoPeriodo: number;
  saldoCapitalPendiente: number;
};

export function Fila({
  etiqueta,
  valor,
  tono,
  destacado,
}: {
  etiqueta: string;
  valor: string;
  tono?: "warning" | "success";
  destacado?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{etiqueta}</span>
      <span
        className={cn(
          "tabular-nums",
          destacado ? "font-semibold" : "font-medium",
          tono === "warning" ? "text-warning" : tono === "success" ? "text-success" : "text-foreground",
        )}
      >
        {valor}
      </span>
    </div>
  );
}

/**
 * Campos compartidos por los modales de cierre (normal e incumplimiento):
 * arriendo editable (override puntual, no afecta el contrato a futuro) +
 * resumen recalculado en vivo con el mismo motor puro del servidor.
 */
export function ResumenCierreCampos({
  arriendoFijoMensual,
  moraAcumulada,
  cobradoPeriodo,
  saldoCapitalPendiente,
  arriendoTexto,
  onArriendoTextoChange,
  mensajeFinalizado,
}: Omit<DatosCierre, "contratoId"> & {
  arriendoTexto: string;
  onArriendoTextoChange: (valor: string) => void;
  mensajeFinalizado: string;
}) {
  const arriendoUsado = Number(arriendoTexto);
  const arriendoValido = arriendoTexto.trim() !== "" && Number.isInteger(arriendoUsado) && arriendoUsado >= 0;
  const preview = arriendoValido
    ? calcularCierrePeriodo({
        arriendoFijoMensual: arriendoUsado,
        moraAcumulada,
        cobradoPeriodo,
        saldoCapitalPendiente,
      })
    : null;
  const arriendoEsDistinto = arriendoValido && arriendoUsado !== arriendoFijoMensual;

  return (
    <>
      <div className="flex flex-col gap-1">
        <Label htmlFor="arriendoFijoUsado">Arriendo a usar en este cierre</Label>
        <Input
          id="arriendoFijoUsado"
          name="arriendoFijoUsado"
          type="number"
          min={0}
          required
          value={arriendoTexto}
          onChange={(e) => onArriendoTextoChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Por defecto es el arriendo fijo del contrato ({formatCOP(arriendoFijoMensual)}); cámbialo solo si hubo un
          acuerdo puntual para este periodo. No modifica el arriendo fijo del contrato a futuro.
        </p>
        {arriendoEsDistinto && (
          <p className="text-xs font-medium text-warning">
            Estás usando un arriendo distinto al fijo del contrato solo para este cierre.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5 rounded-lg border border-border p-3">
        <p className="mb-0.5 text-xs font-semibold tracking-wide text-muted-foreground">RESUMEN DEL CIERRE</p>
        <Fila etiqueta="Cobrado en el periodo" valor={formatCOP(cobradoPeriodo)} />
        <Fila etiqueta="Mora anterior" valor={formatCOP(moraAcumulada)} />
        {preview ? (
          <>
            <div className="my-1 h-px bg-border" />
            <Fila etiqueta="Arriendo cubierto" valor={formatCOP(preview.arriendoCubierto)} />
            <Fila
              etiqueta="Mora nueva"
              valor={formatCOP(preview.moraNueva)}
              tono={preview.moraNueva > 0 ? "warning" : "success"}
            />
            <Fila
              etiqueta="Abono a capital"
              valor={formatCOP(preview.abonoCapital)}
              tono={preview.abonoCapital > 0 ? "success" : undefined}
            />
            <Fila etiqueta="Saldo de capital nuevo" valor={formatCOP(preview.saldoCapitalNuevo)} destacado />
            {preview.contratoFinalizado && (
              <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-success">
                <CircleCheck className="size-3.5" />
                {mensajeFinalizado}
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-destructive">Ingresa un arriendo válido (entero, mayor o igual a cero).</p>
        )}
      </div>
    </>
  );
}
