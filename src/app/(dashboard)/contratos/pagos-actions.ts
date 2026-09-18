"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { formatCOP } from "@/lib/money";
import { parsePagoFormData } from "@/lib/validation/pago";
import { guardarDocumento } from "@/lib/upload";
import {
  MontoExcedeSaldoError,
  PeriodoAbiertoConSaldoError,
  registrarAbonoCapitalDirecto,
} from "@/server/engine/abonoCapitalService";

export type PagoFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  ok?: boolean;
};

export async function registrarPago(
  contratoId: string,
  _prevState: PagoFormState,
  formData: FormData,
): Promise<PagoFormState> {
  const parsed = parsePagoFormData(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }

  const contrato = await prisma.contrato.findUniqueOrThrow({
    where: { id: contratoId },
    select: { estado: true, saldoCapitalPendiente: true },
  });
  if (contrato.estado !== "ACTIVO") {
    return { error: "Este contrato ya está finalizado; no se pueden registrar más pagos." };
  }

  const { tipo, ...datosPago } = parsed.data;

  if (tipo === "ABONO_CAPITAL") {
    if (datosPago.monto > contrato.saldoCapitalPendiente) {
      return {
        fieldErrors: { monto: [`No puede superar el saldo de capital pendiente (${formatCOP(contrato.saldoCapitalPendiente)}).`] },
      };
    }
  }

  const archivo = formData.get("comprobante");
  let comprobante: Extract<Awaited<ReturnType<typeof guardarDocumento>>, { ok: true }> | null = null;
  if (archivo instanceof File && archivo.size > 0) {
    const resultado = await guardarDocumento(archivo, "pagos");
    if (!resultado.ok) {
      return { fieldErrors: { comprobante: [resultado.error] } };
    }
    comprobante = resultado;
  }

  let pagoId: string;

  if (tipo === "ABONO_CAPITAL") {
    try {
      const resultado = await registrarAbonoCapitalDirecto(contratoId, datosPago);
      pagoId = resultado.pagoId;
    } catch (error) {
      if (error instanceof MontoExcedeSaldoError) {
        return { fieldErrors: { monto: ["Supera el saldo de capital pendiente."] } };
      }
      if (error instanceof PeriodoAbiertoConSaldoError) {
        return {
          error:
            "Este abono saldaría el capital, pero el periodo actual todavía tiene pagos de arriendo sin cerrar. Cierra el periodo primero y vuelve a intentarlo.",
        };
      }
      throw error;
    }
  } else {
    const pago = await prisma.pago.create({ data: { contratoId, tipo, ...datosPago } });
    pagoId = pago.id;
  }

  if (comprobante) {
    await prisma.documento.create({
      data: {
        tipo: "COMPROBANTE_PAGO",
        nombreOriginal: comprobante.nombreOriginal,
        rutaAlmacenamiento: comprobante.url,
        mimeType: comprobante.mimeType,
        tamanioBytes: comprobante.tamanioBytes,
        contratoId,
        pagoId,
      },
    });
  }

  revalidatePath(`/contratos/${contratoId}`);
  revalidatePath("/pagos");
  revalidatePath("/");
  revalidatePath("/motos");
  return { ok: true };
}

export type EliminarPagoResultado = { error?: string };

/** Regla de inmutabilidad del ledger: solo se puede borrar un pago de ARRIENDO mientras sigue en el periodo abierto. */
export async function eliminarPago(
  pagoId: string,
  _prevState: EliminarPagoResultado,
  _formData: FormData,
): Promise<EliminarPagoResultado> {
  const pago = await prisma.pago.findUniqueOrThrow({
    where: { id: pagoId },
    select: { contratoId: true, periodoCierreId: true, tipo: true },
  });
  if (pago.tipo === "ABONO_CAPITAL") {
    return { error: "Los abonos a capital se aplican de inmediato y no se pueden eliminar." };
  }
  if (pago.periodoCierreId !== null) {
    return { error: "Este pago ya quedó incluido en un periodo cerrado y no se puede eliminar." };
  }

  await prisma.pago.delete({ where: { id: pagoId } });
  revalidatePath(`/contratos/${pago.contratoId}`);
  revalidatePath("/pagos");
  return {};
}

export type EliminarPagosResultado = { error?: string; eliminados?: number };

/** Elimina en lote solo los pagos de ARRIENDO que siguen en periodo abierto; ignora el resto. */
export async function eliminarPagos(ids: string[]): Promise<EliminarPagosResultado> {
  if (ids.length === 0) return { eliminados: 0 };

  const pagos = await prisma.pago.findMany({
    where: { id: { in: ids } },
    select: { id: true, contratoId: true, periodoCierreId: true, tipo: true },
  });
  const eliminables = pagos.filter((p) => p.tipo === "ARRIENDO" && p.periodoCierreId === null);
  if (eliminables.length === 0) {
    return { error: "Ninguno de los pagos seleccionados se puede eliminar (periodo cerrado o abono a capital)." };
  }

  await prisma.pago.deleteMany({ where: { id: { in: eliminables.map((p) => p.id) } } });

  const contratoIds = [...new Set(eliminables.map((p) => p.contratoId))];
  for (const contratoId of contratoIds) revalidatePath(`/contratos/${contratoId}`);
  revalidatePath("/pagos");

  return { eliminados: eliminables.length };
}
