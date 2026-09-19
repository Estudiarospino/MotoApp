"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { parseNotaPrestamoFormData } from "@/lib/validation/prestamo";

export type NotaFormState = { error?: string; fieldErrors?: Record<string, string[]>; ok?: boolean };

export async function crearNotaPrestamo(
  prestamoId: string,
  _prevState: NotaFormState,
  formData: FormData,
): Promise<NotaFormState> {
  const parsed = parseNotaPrestamoFormData(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }

  await prisma.notaPrestamo.create({ data: { prestamoId, contenido: parsed.data.contenido } });
  revalidatePath(`/prestamos/${prestamoId}`);
  return { ok: true };
}
