"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { parseMotocicletaFormData } from "@/lib/validation/motocicleta";

export type MotocicletaFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function esViolacionUnica(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createMotocicleta(
  _prevState: MotocicletaFormState,
  formData: FormData,
): Promise<MotocicletaFormState> {
  const parsed = parseMotocicletaFormData(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }

  try {
    await prisma.motocicleta.create({ data: parsed.data });
  } catch (error) {
    if (esViolacionUnica(error)) {
      return { error: "Ya existe una moto registrada con esa placa." };
    }
    throw error;
  }

  revalidatePath("/motos");
  redirect("/motos");
}

export async function updateMotocicleta(
  id: string,
  _prevState: MotocicletaFormState,
  formData: FormData,
): Promise<MotocicletaFormState> {
  const parsed = parseMotocicletaFormData(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }

  try {
    await prisma.motocicleta.update({ where: { id }, data: parsed.data });
  } catch (error) {
    if (esViolacionUnica(error)) {
      return { error: "Ya existe una moto registrada con esa placa." };
    }
    throw error;
  }

  revalidatePath("/motos");
  redirect("/motos");
}

export type EliminarMotoResultado = { error?: string };

/** Solo permite borrar motos que nunca tuvieron actividad real (sin contratos, gastos ni préstamos). */
export async function deleteMotocicletaSiNoTieneHistorial(
  id: string,
  _prevState: EliminarMotoResultado,
  _formData: FormData,
): Promise<EliminarMotoResultado> {
  const [contratos, gastos, prestamos] = await Promise.all([
    prisma.contrato.count({ where: { motocicletaId: id } }),
    prisma.gasto.count({ where: { motocicletaId: id } }),
    prisma.prestamo.count({ where: { motocicletaId: id } }),
  ]);

  if (contratos > 0 || gastos > 0 || prestamos > 0) {
    return {
      error: "Esta moto ya tiene contratos, gastos o préstamos asociados y no se puede eliminar.",
    };
  }

  await prisma.motocicleta.delete({ where: { id } });
  revalidatePath("/motos");
  return {};
}
