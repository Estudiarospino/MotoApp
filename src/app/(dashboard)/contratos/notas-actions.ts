"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";

export type NotaFormState = { error?: string; fieldErrors?: Record<string, string[]> };

const notaSchema = z.object({
  contenido: z.string().trim().min(1, "Escribe una nota antes de guardar.").max(2000),
});

export async function crearNotaContrato(
  contratoId: string,
  _prevState: NotaFormState,
  formData: FormData,
): Promise<NotaFormState> {
  const parsed = notaSchema.safeParse({ contenido: formData.get("contenido") });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }

  await prisma.notaContrato.create({ data: { contratoId, contenido: parsed.data.contenido } });
  revalidatePath(`/contratos/${contratoId}`);
  return {};
}
