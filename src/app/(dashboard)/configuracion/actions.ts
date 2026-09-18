"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { parseCuentaFormData, parseMetodoPagoFormData } from "@/lib/validation/configuracion";

export type ConfiguracionFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  ok?: boolean;
};

export async function crearCuenta(
  _prevState: ConfiguracionFormState,
  formData: FormData,
): Promise<ConfiguracionFormState> {
  const parsed = parseCuentaFormData(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }

  await prisma.cuenta.create({ data: parsed.data });
  revalidatePath("/configuracion");
  return { ok: true };
}

export async function toggleActivaCuenta(id: string): Promise<void> {
  const cuenta = await prisma.cuenta.findUniqueOrThrow({ where: { id }, select: { activa: true } });
  await prisma.cuenta.update({ where: { id }, data: { activa: !cuenta.activa } });
  revalidatePath("/configuracion");
}

export async function crearMetodoPago(
  _prevState: ConfiguracionFormState,
  formData: FormData,
): Promise<ConfiguracionFormState> {
  const parsed = parseMetodoPagoFormData(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }

  await prisma.metodoPago.create({ data: parsed.data });
  revalidatePath("/configuracion");
  revalidatePath("/pagos");
  return { ok: true };
}

class UltimoMetodoActivoError extends Error {}

export type ToggleMetodoResultado = { error?: string };

/** No se puede desactivar el último método activo: el formulario de pago se quedaría sin opciones. */
export async function toggleActivoMetodoPago(id: string): Promise<ToggleMetodoResultado> {
  const metodo = await prisma.metodoPago.findUniqueOrThrow({ where: { id }, select: { activo: true } });

  try {
    if (metodo.activo) {
      const activosRestantes = await prisma.metodoPago.count({ where: { activo: true, id: { not: id } } });
      if (activosRestantes === 0) {
        throw new UltimoMetodoActivoError();
      }
    }
    await prisma.metodoPago.update({ where: { id }, data: { activo: !metodo.activo } });
  } catch (error) {
    if (error instanceof UltimoMetodoActivoError) {
      return { error: "Debe quedar al menos un método de pago activo." };
    }
    throw error;
  }

  revalidatePath("/configuracion");
  revalidatePath("/pagos");
  return {};
}
