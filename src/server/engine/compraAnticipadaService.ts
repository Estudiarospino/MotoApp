import "server-only";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { pesos, type Pesos } from "@/lib/money";
import { calcularCompraAnticipada } from "./compraAnticipada";
import {
  aplicarContratoOFallar,
  bloquearContratoActivo,
  capturarPagosAbiertos,
  siguienteNumeroPeriodo,
} from "./cierreService";

export type ResultadoEjecucionCompraAnticipada =
  | { aceptada: true; periodoCierreId: string }
  | { aceptada: false; montoFaltante: Pesos };

/** Orquestación transaccional: reutiliza el bloqueo y la captura de pagos del motor de cierre normal. */
export async function ejecutarCompraAnticipada(
  contratoId: string,
): Promise<ResultadoEjecucionCompraAnticipada> {
  return prisma.$transaction(
    async (tx) => {
      const contrato = await bloquearContratoActivo(tx, contratoId);
      const { pagoIds, cobradoPeriodo } = await capturarPagosAbiertos(tx, contratoId);

      const resultado = calcularCompraAnticipada({
        arriendoFijoMensual: contrato.arriendoFijoMensual,
        moraAcumulada: contrato.moraAcumulada,
        cobradoPeriodo,
        saldoCapitalPendiente: contrato.saldoCapitalPendiente,
      });

      if (!resultado.aceptada) {
        return resultado;
      }

      const numeroPeriodo = await siguienteNumeroPeriodo(tx, contratoId);
      const periodoCierre = await tx.periodoCierre.create({
        data: {
          contratoId,
          numeroPeriodo,
          tipoCierre: "COMPRA_ANTICIPADA",
          fechaAperturaPeriodo: contrato.fechaAperturaPeriodoActual,
          moraAnterior: contrato.moraAcumulada,
          arriendoFijoUsado: contrato.arriendoFijoMensual,
          metaArriendo: resultado.metaArriendo,
          cobradoPeriodo,
          arriendoCubierto: resultado.arriendoCubierto,
          abonoCapital: resultado.abonoCapital,
          moraNueva: pesos(0),
          saldoCapitalAnterior: contrato.saldoCapitalPendiente,
          saldoCapitalNuevo: resultado.saldoCapitalNuevo,
          excedenteNoAplicado: resultado.excedenteNoAplicado,
          contratoFinalizado: true,
        },
      });

      if (pagoIds.length > 0) {
        await tx.pago.updateMany({
          where: { id: { in: pagoIds } },
          data: { periodoCierreId: periodoCierre.id },
        });
      }

      const ahora = new Date();
      await aplicarContratoOFallar(tx, contratoId, contrato.version, {
        saldoCapitalPendiente: resultado.saldoCapitalNuevo,
        moraAcumulada: pesos(0),
        fechaAperturaPeriodoActual: ahora,
        estado: "FINALIZADO_COMPRADO",
        finalizadoAt: ahora,
      });

      await tx.motocicleta.update({
        where: { id: contrato.motocicletaId },
        data: { estado: "VENDIDA" },
      });

      return { aceptada: true, periodoCierreId: periodoCierre.id };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
