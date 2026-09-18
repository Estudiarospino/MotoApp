"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  parseCrearContratoFormData,
  parseEditarContratoFormData,
} from "@/lib/validation/contrato";

export type ContratoFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

class MotoNoDisponibleError extends Error {}

export async function createContrato(
  _prevState: ContratoFormState,
  formData: FormData,
): Promise<ContratoFormState> {
  const parsed = parseCrearContratoFormData(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }

  const {
    clienteId,
    motocicletaId,
    fechaInicio,
    fechaFinEstimada,
    valorTotalContrato,
    arriendoFijoMensual,
    metaMensualReferencia,
    cuotaDiariaReferencia,
  } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      // updateMany con la condición de estado evita la carrera de asignar la
      // misma moto a dos contratos si dos pestañas crean uno al mismo tiempo.
      const motoActualizada = await tx.motocicleta.updateMany({
        where: { id: motocicletaId, estado: "DISPONIBLE" },
        data: { estado: "EN_CONTRATO" },
      });
      if (motoActualizada.count === 0) {
        throw new MotoNoDisponibleError();
      }

      await tx.contrato.create({
        data: {
          clienteId,
          motocicletaId,
          valorTotalContrato,
          arriendoFijoMensual,
          metaMensualReferencia,
          cuotaDiariaReferencia,
          fechaInicio,
          fechaFinEstimada,
          saldoCapitalPendiente: valorTotalContrato,
          fechaAperturaPeriodoActual: fechaInicio,
        },
      });
    });
  } catch (error) {
    if (error instanceof MotoNoDisponibleError) {
      return { error: "Esa moto ya no está disponible. Elige otra." };
    }
    throw error;
  }

  revalidatePath("/contratos");
  revalidatePath("/motos");
  redirect("/contratos");
}

export async function updateContrato(
  id: string,
  _prevState: ContratoFormState,
  formData: FormData,
): Promise<ContratoFormState> {
  const parsed = parseEditarContratoFormData(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }

  const contrato = await prisma.contrato.findUniqueOrThrow({ where: { id } });
  if (contrato.estado !== "ACTIVO") {
    return { error: "Este contrato ya está finalizado y no se puede editar." };
  }

  // `undefined` significa "no tocar el campo" para Prisma: los campos
  // opcionales que el usuario dejó vacíos deben mandarse como `null`
  // explícito para poder limpiarlos.
  const { arriendoFijoMensual, metaMensualReferencia, cuotaDiariaReferencia, fechaFinEstimada } =
    parsed.data;

  await prisma.contrato.update({
    where: { id },
    data: {
      arriendoFijoMensual,
      metaMensualReferencia: metaMensualReferencia ?? null,
      cuotaDiariaReferencia: cuotaDiariaReferencia ?? null,
      fechaFinEstimada: fechaFinEstimada ?? null,
    },
  });

  revalidatePath("/contratos");
  revalidatePath(`/contratos/${id}`);
  redirect(`/contratos/${id}`);
}
