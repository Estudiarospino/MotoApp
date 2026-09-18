"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { parseGastoFormData } from "@/lib/validation/gasto";

export type GastoFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createGasto(
  _prevState: GastoFormState,
  formData: FormData,
): Promise<GastoFormState> {
  const parsed = parseGastoFormData(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }

  await prisma.gasto.create({ data: parsed.data });

  revalidatePath("/gastos");
  revalidatePath(`/motos/${parsed.data.motocicletaId}`);
  redirect("/gastos");
}

export async function updateGasto(
  id: string,
  _prevState: GastoFormState,
  formData: FormData,
): Promise<GastoFormState> {
  const parsed = parseGastoFormData(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }

  await prisma.gasto.update({ where: { id }, data: parsed.data });

  revalidatePath("/gastos");
  revalidatePath(`/motos/${parsed.data.motocicletaId}`);
  redirect("/gastos");
}

export async function deleteGasto(id: string): Promise<void> {
  const gasto = await prisma.gasto.delete({ where: { id } });
  revalidatePath("/gastos");
  revalidatePath(`/motos/${gasto.motocicletaId}`);
}
