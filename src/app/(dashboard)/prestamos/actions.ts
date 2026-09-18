"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { restarPesos } from "@/lib/money";
import { parseAbonoPrestamoFormData, parsePrestamoFormData } from "@/lib/validation/prestamo";

export type PrestamoFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createPrestamo(
  _prevState: PrestamoFormState,
  formData: FormData,
): Promise<PrestamoFormState> {
  const parsed = parsePrestamoFormData(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }

  await prisma.prestamo.create({
    data: { ...parsed.data, saldoPendiente: parsed.data.montoOriginal },
  });

  revalidatePath("/prestamos");
  redirect("/prestamos");
}

export type AbonoFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

class PrestamoNoActivoError extends Error {}
class AbonoExcedeSaldoError extends Error {}

export async function registrarAbono(
  prestamoId: string,
  _prevState: AbonoFormState,
  formData: FormData,
): Promise<AbonoFormState> {
  const parsed = parseAbonoPrestamoFormData(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const prestamo = await tx.prestamo.findUniqueOrThrow({ where: { id: prestamoId } });

      if (prestamo.estado !== "ACTIVO") {
        throw new PrestamoNoActivoError();
      }
      if (parsed.data.monto > prestamo.saldoPendiente) {
        throw new AbonoExcedeSaldoError();
      }

      const saldoNuevo = restarPesos(prestamo.saldoPendiente, parsed.data.monto);

      await tx.abonoPrestamo.create({ data: { prestamoId, ...parsed.data } });
      await tx.prestamo.update({
        where: { id: prestamoId },
        data: {
          saldoPendiente: saldoNuevo,
          estado: saldoNuevo === 0 ? "PAGADO" : "ACTIVO",
        },
      });
    });
  } catch (error) {
    if (error instanceof PrestamoNoActivoError) {
      return { error: "Este préstamo ya está pagado; no se pueden registrar más abonos." };
    }
    if (error instanceof AbonoExcedeSaldoError) {
      return { error: "El abono no puede superar el saldo pendiente." };
    }
    throw error;
  }

  revalidatePath(`/prestamos/${prestamoId}`);
  revalidatePath("/prestamos");
  return {};
}
