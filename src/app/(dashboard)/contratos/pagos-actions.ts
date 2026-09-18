"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { parsePagoFormData } from "@/lib/validation/pago";

export type PagoFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
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
    select: { estado: true },
  });
  if (contrato.estado !== "ACTIVO") {
    return { error: "Este contrato ya está finalizado; no se pueden registrar más pagos." };
  }

  await prisma.pago.create({ data: { contratoId, ...parsed.data } });

  revalidatePath(`/contratos/${contratoId}`);
  redirect(`/contratos/${contratoId}`);
}

export type EliminarPagoResultado = { error?: string };

/** Regla de inmutabilidad del ledger: solo se puede borrar mientras el pago sigue en el periodo abierto. */
export async function eliminarPago(
  pagoId: string,
  _prevState: EliminarPagoResultado,
  _formData: FormData,
): Promise<EliminarPagoResultado> {
  const pago = await prisma.pago.findUniqueOrThrow({
    where: { id: pagoId },
    select: { contratoId: true, periodoCierreId: true },
  });
  if (pago.periodoCierreId !== null) {
    return { error: "Este pago ya quedó incluido en un periodo cerrado y no se puede eliminar." };
  }

  await prisma.pago.delete({ where: { id: pagoId } });
  revalidatePath(`/contratos/${pago.contratoId}`);
  return {};
}
