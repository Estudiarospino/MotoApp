import "server-only";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { type Pesos } from "@/lib/money";
import { calcularAbonoCapital, MontoExcedeSaldoError } from "./abonoCapital";
import { aplicarContratoOFallar, bloquearContratoActivo, capturarPagosAbiertos } from "./cierreService";

export { MontoExcedeSaldoError };
export class PeriodoAbiertoConSaldoError extends Error {}

export type DatosAbonoCapital = {
  fecha: Date;
  monto: Pesos;
  metodoPagoId: string;
  referencia?: string;
  notas?: string;
};

export type ResultadoAbonoCapitalDirecto = { pagoId: string; contratoFinalizado: boolean };

/**
 * Abono directo a capital: reduce `saldoCapitalPendiente` de inmediato, sin
 * pasar por el periodo abierto ni tocar la mora. Si agota el saldo pero el
 * periodo abierto todavía tiene pagos de arriendo sin cerrar, se rechaza
 * (ese dinero debe cerrarse en un periodo antes de poder finalizar el
 * contrato, igual que en el cierre normal).
 */
export async function registrarAbonoCapitalDirecto(
  contratoId: string,
  datos: DatosAbonoCapital,
): Promise<ResultadoAbonoCapitalDirecto> {
  return prisma.$transaction(
    async (tx) => {
      const contrato = await bloquearContratoActivo(tx, contratoId);
      const resultado = calcularAbonoCapital({
        saldoCapitalPendiente: contrato.saldoCapitalPendiente,
        monto: datos.monto,
      });

      if (resultado.contratoFinalizado) {
        const { cobradoPeriodo } = await capturarPagosAbiertos(tx, contratoId);
        if (cobradoPeriodo > 0) {
          throw new PeriodoAbiertoConSaldoError();
        }
      }

      const pago = await tx.pago.create({
        data: {
          contratoId,
          tipo: "ABONO_CAPITAL",
          fecha: datos.fecha,
          monto: datos.monto,
          metodoPagoId: datos.metodoPagoId,
          referencia: datos.referencia,
          notas: datos.notas,
        },
      });

      const ahora = new Date();
      await aplicarContratoOFallar(tx, contratoId, contrato.version, {
        saldoCapitalPendiente: resultado.saldoCapitalNuevo,
        estado: resultado.contratoFinalizado ? "FINALIZADO_PAGADO" : "ACTIVO",
        finalizadoAt: resultado.contratoFinalizado ? ahora : null,
      });

      if (resultado.contratoFinalizado) {
        await tx.motocicleta.update({
          where: { id: contrato.motocicletaId },
          data: { estado: "VENDIDA" },
        });
      }

      return { pagoId: pago.id, contratoFinalizado: resultado.contratoFinalizado };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
