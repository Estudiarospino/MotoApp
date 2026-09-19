"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { restarPesos } from "@/lib/money";
import {
  parseAbonoPrestamoFormData,
  parseEditarPrestamoFormData,
  parsePrestamoFormData,
  parseTransferenciaCapitalFormData,
} from "@/lib/validation/prestamo";
import {
  ClienteNoCoincideError,
  ConflictoConcurrenciaError,
  ContratoNoActivoError,
  MontoExcedeSaldoPrestamoError,
  PrestamoNoActivoError as TransferenciaPrestamoNoActivoError,
  transferirPrestamoACapital,
} from "@/server/engine/transferenciaCapitalService";

export type PrestamoFormState = {
  ok?: boolean;
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
  return { ok: true };
}

export async function updatePrestamo(
  id: string,
  _prevState: PrestamoFormState,
  formData: FormData,
): Promise<PrestamoFormState> {
  const parsed = parseEditarPrestamoFormData(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }

  await prisma.prestamo.update({ where: { id }, data: parsed.data });

  revalidatePath(`/prestamos/${id}`);
  revalidatePath("/prestamos");
  return { ok: true };
}

export type AbonoFormState = {
  ok?: boolean;
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
  return { ok: true };
}

export type TransferenciaFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  ok?: boolean;
};

export async function transferirACapitalAction(
  prestamoId: string,
  _prevState: TransferenciaFormState,
  formData: FormData,
): Promise<TransferenciaFormState> {
  const parsed = parseTransferenciaCapitalFormData(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }

  const { contratoId, ...datos } = parsed.data;

  try {
    await transferirPrestamoACapital(prestamoId, contratoId, datos);
  } catch (error) {
    if (error instanceof TransferenciaPrestamoNoActivoError) {
      return { error: "Este préstamo ya está pagado; no se puede transferir." };
    }
    if (error instanceof MontoExcedeSaldoPrestamoError) {
      return { fieldErrors: { monto: ["No puede superar el saldo pendiente del préstamo."] } };
    }
    if (error instanceof ClienteNoCoincideError) {
      return { error: "El contrato elegido no pertenece al mismo cliente del préstamo." };
    }
    if (error instanceof ContratoNoActivoError) {
      return { error: "Ese contrato ya no está activo." };
    }
    if (error instanceof ConflictoConcurrenciaError) {
      return { error: "Otra operación modificó el contrato al mismo tiempo. Vuelve a intentarlo." };
    }
    throw error;
  }

  revalidatePath(`/prestamos/${prestamoId}`);
  revalidatePath("/prestamos");
  revalidatePath(`/contratos/${contratoId}`);
  revalidatePath("/contratos");
  return { ok: true };
}
