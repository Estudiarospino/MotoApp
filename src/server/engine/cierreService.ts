import "server-only";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import type { Contrato } from "@/generated/prisma/client";
import { type Pesos, sumarPesos } from "@/lib/money";
import { calcularCierrePeriodo, type ResultadoCierre } from "./cierre";

export class ContratoNoActivoError extends Error {}
export class ConflictoConcurrenciaError extends Error {}

type TxClient = Prisma.TransactionClient;

/**
 * Bloquea la fila del contrato (`SELECT ... FOR UPDATE`) para serializar
 * cierres concurrentes sobre el mismo contrato, y confirma que sigue activo.
 */
export async function bloquearContratoActivo(tx: TxClient, contratoId: string): Promise<Contrato> {
  await tx.$executeRaw`SELECT id FROM "Contrato" WHERE id = ${contratoId} FOR UPDATE`;

  const contrato = await tx.contrato.findUniqueOrThrow({ where: { id: contratoId } });
  if (contrato.estado !== "ACTIVO") {
    throw new ContratoNoActivoError();
  }
  return contrato;
}

/** Captura el conjunto exacto de IDs de pagos del periodo abierto — nunca se actualiza por condición genérica. */
export async function capturarPagosAbiertos(
  tx: TxClient,
  contratoId: string,
): Promise<{ pagoIds: string[]; cobradoPeriodo: Pesos }> {
  const pagos = await tx.pago.findMany({
    where: { contratoId, periodoCierreId: null },
    select: { id: true, monto: true },
  });
  return { pagoIds: pagos.map((p) => p.id), cobradoPeriodo: sumarPesos(...pagos.map((p) => p.monto)) };
}

export async function siguienteNumeroPeriodo(tx: TxClient, contratoId: string): Promise<number> {
  const total = await tx.periodoCierre.count({ where: { contratoId } });
  return total + 1;
}

/** Bloqueo optimista: si `version` ya cambió, otra transacción se adelantó. */
export async function aplicarContratoOFallar(
  tx: TxClient,
  contratoId: string,
  versionEsperada: number,
  data: Prisma.ContratoUpdateInput,
): Promise<void> {
  const actualizado = await tx.contrato.updateMany({
    where: { id: contratoId, version: versionEsperada },
    data: { ...data, version: { increment: 1 } },
  });
  if (actualizado.count === 0) {
    throw new ConflictoConcurrenciaError();
  }
}

async function crearPeriodoCierreNormal(
  tx: TxClient,
  contrato: Contrato,
  numeroPeriodo: number,
  cobradoPeriodo: Pesos,
  resultado: ResultadoCierre,
  contratoFinalizado: boolean,
) {
  const periodoCierre = await tx.periodoCierre.create({
    data: {
      contratoId: contrato.id,
      numeroPeriodo,
      tipoCierre: "NORMAL",
      fechaAperturaPeriodo: contrato.fechaAperturaPeriodoActual,
      moraAnterior: contrato.moraAcumulada,
      arriendoFijoUsado: contrato.arriendoFijoMensual,
      metaArriendo: resultado.metaArriendo,
      cobradoPeriodo,
      arriendoCubierto: resultado.arriendoCubierto,
      abonoCapital: resultado.abonoCapital,
      moraNueva: resultado.moraNueva,
      saldoCapitalAnterior: contrato.saldoCapitalPendiente,
      saldoCapitalNuevo: resultado.saldoCapitalNuevo,
      contratoFinalizado,
    },
  });
  return periodoCierre;
}

/** Cierre normal del periodo abierto: nunca falla por monto insuficiente, solo acumula mora. */
export async function cerrarPeriodoNormal(contratoId: string): Promise<string> {
  return prisma.$transaction(
    async (tx) => {
      const contrato = await bloquearContratoActivo(tx, contratoId);
      const { pagoIds, cobradoPeriodo } = await capturarPagosAbiertos(tx, contratoId);
      const numeroPeriodo = await siguienteNumeroPeriodo(tx, contratoId);

      const resultado = calcularCierrePeriodo({
        arriendoFijoMensual: contrato.arriendoFijoMensual,
        moraAcumulada: contrato.moraAcumulada,
        cobradoPeriodo,
        saldoCapitalPendiente: contrato.saldoCapitalPendiente,
      });

      const periodoCierre = await crearPeriodoCierreNormal(
        tx,
        contrato,
        numeroPeriodo,
        cobradoPeriodo,
        resultado,
        resultado.contratoFinalizado,
      );

      if (pagoIds.length > 0) {
        await tx.pago.updateMany({
          where: { id: { in: pagoIds } },
          data: { periodoCierreId: periodoCierre.id },
        });
      }

      const ahora = new Date();
      await aplicarContratoOFallar(tx, contratoId, contrato.version, {
        saldoCapitalPendiente: resultado.saldoCapitalNuevo,
        moraAcumulada: resultado.moraNueva,
        fechaAperturaPeriodoActual: ahora,
        estado: resultado.contratoFinalizado ? "FINALIZADO_PAGADO" : "ACTIVO",
        finalizadoAt: resultado.contratoFinalizado ? ahora : null,
      });

      if (resultado.contratoFinalizado) {
        await tx.motocicleta.update({
          where: { id: contrato.motocicletaId },
          data: { estado: "VENDIDA" },
        });
      }

      return periodoCierre.id;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

/**
 * El dueño marca el contrato como incumplido: se cierra formalmente el
 * periodo abierto (mismo algoritmo, aunque no alcance la meta) para que
 * ningún pago quede huérfano, y la moto vuelve a estar disponible.
 */
export async function cerrarPorIncumplimiento(contratoId: string): Promise<string> {
  return prisma.$transaction(
    async (tx) => {
      const contrato = await bloquearContratoActivo(tx, contratoId);
      const { pagoIds, cobradoPeriodo } = await capturarPagosAbiertos(tx, contratoId);
      const numeroPeriodo = await siguienteNumeroPeriodo(tx, contratoId);

      const resultado = calcularCierrePeriodo({
        arriendoFijoMensual: contrato.arriendoFijoMensual,
        moraAcumulada: contrato.moraAcumulada,
        cobradoPeriodo,
        saldoCapitalPendiente: contrato.saldoCapitalPendiente,
      });

      const periodoCierre = await crearPeriodoCierreNormal(
        tx,
        contrato,
        numeroPeriodo,
        cobradoPeriodo,
        resultado,
        true,
      );

      if (pagoIds.length > 0) {
        await tx.pago.updateMany({
          where: { id: { in: pagoIds } },
          data: { periodoCierreId: periodoCierre.id },
        });
      }

      const ahora = new Date();
      await aplicarContratoOFallar(tx, contratoId, contrato.version, {
        saldoCapitalPendiente: resultado.saldoCapitalNuevo,
        moraAcumulada: resultado.moraNueva,
        fechaAperturaPeriodoActual: ahora,
        estado: "INCUMPLIDO_RECUPERADA",
        finalizadoAt: ahora,
      });

      await tx.motocicleta.update({
        where: { id: contrato.motocicletaId },
        data: { estado: "DISPONIBLE" },
      });

      return periodoCierre.id;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
