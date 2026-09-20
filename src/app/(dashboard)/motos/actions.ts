"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { parseMotocicletaFormData } from "@/lib/validation/motocicleta";
import { eliminarArchivo, guardarImagen } from "@/lib/upload";

export type MotocicletaFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function esViolacionUnica(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/** Extrae el archivo de foto del formulario, si el usuario seleccionó uno. */
function extraerFoto(formData: FormData): File | null {
  const foto = formData.get("foto");
  return foto instanceof File && foto.size > 0 ? foto : null;
}

export async function createMotocicleta(
  _prevState: MotocicletaFormState,
  formData: FormData,
): Promise<MotocicletaFormState> {
  const parsed = parseMotocicletaFormData(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }

  const foto = extraerFoto(formData);
  let fotoUrl: string | undefined;
  if (foto) {
    const resultado = await guardarImagen(foto, "motos");
    if (!resultado.ok) {
      return { error: resultado.error };
    }
    fotoUrl = resultado.url;
  }

  try {
    await prisma.motocicleta.create({ data: { ...parsed.data, fotoUrl } });
  } catch (error) {
    if (esViolacionUnica(error)) {
      return { error: "Ya existe una moto registrada con esa placa." };
    }
    throw error;
  }

  revalidatePath("/motos");
  return { ok: true };
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

  const foto = extraerFoto(formData);
  let fotoUrl: string | undefined;
  let fotoAnterior: string | null = null;
  if (foto) {
    const existente = await prisma.motocicleta.findUniqueOrThrow({ where: { id }, select: { fotoUrl: true } });
    fotoAnterior = existente.fotoUrl;

    const resultado = await guardarImagen(foto, "motos");
    if (!resultado.ok) {
      return { error: resultado.error };
    }
    fotoUrl = resultado.url;
  }

  try {
    await prisma.motocicleta.update({ where: { id }, data: { ...parsed.data, ...(fotoUrl && { fotoUrl }) } });
  } catch (error) {
    if (esViolacionUnica(error)) {
      return { error: "Ya existe una moto registrada con esa placa." };
    }
    throw error;
  }

  if (fotoUrl && fotoAnterior) {
    await eliminarArchivo(fotoAnterior);
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
    prisma.prestamo.count({ where: { contrato: { motocicletaId: id } } }),
  ]);

  if (contratos > 0 || gastos > 0 || prestamos > 0) {
    return {
      error: "Esta moto ya tiene contratos, gastos o préstamos asociados y no se puede eliminar.",
    };
  }

  const moto = await prisma.motocicleta.delete({ where: { id }, select: { fotoUrl: true } });
  await eliminarArchivo(moto.fotoUrl);
  revalidatePath("/motos");
  return {};
}
