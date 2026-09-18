import "server-only";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { type Pesos, sumarPesos } from "@/lib/money";
import { calcularTransferenciaCapital, MontoExcedeSaldoPrestamoError } from "./transferenciaCapital";
import { aplicarContratoOFallar, bloquearContratoActivo, ConflictoConcurrenciaError, ContratoNoActivoError } from "./cierreService";

export { ConflictoConcurrenciaError, ContratoNoActivoError, MontoExcedeSaldoPrestamoError };
export class PrestamoNoActivoError extends Error {}
export class ClienteNoCoincideError extends Error {}

export type DatosTransferencia = {
  monto: Pesos;
  fecha: Date;
  notas?: string;
};

/**
 * Traslada saldo de un préstamo al capital de un contrato del mismo cliente:
 * el saldo del préstamo baja, `saldoCapitalPendiente` y `valorTotalContrato`
 * del contrato suben en la misma cantidad (para no alterar el % ya abonado),
 * y queda un registro auditable en `TransferenciaPrestamoCapital`. Si el
 * préstamo no tenía contrato asociado, queda ligado a este de ahí en adelante.
 */
export async function transferirPrestamoACapital(
  prestamoId: string,
  contratoId: string,
  datos: DatosTransferencia,
): Promise<{ transferenciaId: string }> {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT id FROM "Prestamo" WHERE id = ${prestamoId} FOR UPDATE`;
      const prestamo = await tx.prestamo.findUniqueOrThrow({ where: { id: prestamoId } });
      if (prestamo.estado !== "ACTIVO") {
        throw new PrestamoNoActivoError();
      }

      const contrato = await bloquearContratoActivo(tx, contratoId);
      if (contrato.clienteId !== prestamo.clienteId) {
        throw new ClienteNoCoincideError();
      }

      const resultado = calcularTransferenciaCapital({
        saldoPrestamoPendiente: prestamo.saldoPendiente,
        monto: datos.monto,
      });

      await tx.prestamo.update({
        where: { id: prestamoId },
        data: {
          saldoPendiente: resultado.saldoPrestamoNuevo,
          estado: resultado.prestamoPagado ? "PAGADO" : "ACTIVO",
          contratoId: prestamo.contratoId ?? contratoId,
        },
      });

      await aplicarContratoOFallar(tx, contratoId, contrato.version, {
        saldoCapitalPendiente: sumarPesos(contrato.saldoCapitalPendiente, datos.monto),
        valorTotalContrato: sumarPesos(contrato.valorTotalContrato, datos.monto),
      });

      const transferencia = await tx.transferenciaPrestamoCapital.create({
        data: {
          prestamoId,
          contratoId,
          monto: datos.monto,
          fecha: datos.fecha,
          notas: datos.notas,
        },
      });

      return { transferenciaId: transferencia.id };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
