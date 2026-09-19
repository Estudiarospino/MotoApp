"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  parseCrearContratoFormData,
  parseEditarContratoFormData,
  parseRenegociarContratoFormData,
} from "@/lib/validation/contrato";

export type ContratoFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

class MotoNoDisponibleError extends Error {}
class ContratoAnteriorNoValidoError extends Error {}
class YaRenegociadoError extends Error {}

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
    frecuenciaPago,
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
          frecuenciaPago,
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
  return { ok: true };
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
  const { arriendoFijoMensual, metaMensualReferencia, cuotaDiariaReferencia, frecuenciaPago, fechaFinEstimada } =
    parsed.data;

  await prisma.contrato.update({
    where: { id },
    data: {
      arriendoFijoMensual,
      metaMensualReferencia: metaMensualReferencia ?? null,
      cuotaDiariaReferencia: cuotaDiariaReferencia ?? null,
      frecuenciaPago,
      fechaFinEstimada: fechaFinEstimada ?? null,
    },
  });

  revalidatePath("/contratos");
  revalidatePath(`/contratos/${id}`);
  redirect(`/contratos/${id}`);
}

/**
 * Renegociación: crea un contrato nuevo para el mismo cliente y le traslada la
 * deuda pendiente (capital + mora) de un contrato INCUMPLIDO_RECUPERADA. El
 * contrato anterior no cambia de estado — solo queda el vínculo trazable.
 */
export async function crearContratoRenegociado(
  _prevState: ContratoFormState,
  formData: FormData,
): Promise<ContratoFormState> {
  const parsed = parseRenegociarContratoFormData(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]> };
  }

  const {
    contratoAnteriorId,
    clienteId,
    motocicletaId,
    fechaInicio,
    fechaFinEstimada,
    deudaTrasladada,
    valorTotalContrato,
    arriendoFijoMensual,
    metaMensualReferencia,
    cuotaDiariaReferencia,
    frecuenciaPago,
  } = parsed.data;

  let nuevoContratoId = "";

  try {
    await prisma.$transaction(async (tx) => {
      const contratoAnterior = await tx.contrato.findUniqueOrThrow({ where: { id: contratoAnteriorId } });
      if (contratoAnterior.estado !== "INCUMPLIDO_RECUPERADA" || contratoAnterior.clienteId !== clienteId) {
        throw new ContratoAnteriorNoValidoError();
      }

      const yaRenegociado = await tx.renegociacionContrato.findUnique({ where: { contratoAnteriorId } });
      if (yaRenegociado) {
        throw new YaRenegociadoError();
      }

      const motoActualizada = await tx.motocicleta.updateMany({
        where: { id: motocicletaId, estado: "DISPONIBLE" },
        data: { estado: "EN_CONTRATO" },
      });
      if (motoActualizada.count === 0) {
        throw new MotoNoDisponibleError();
      }

      const contratoNuevo = await tx.contrato.create({
        data: {
          clienteId,
          motocicletaId,
          valorTotalContrato,
          arriendoFijoMensual,
          metaMensualReferencia,
          cuotaDiariaReferencia,
          frecuenciaPago,
          fechaInicio,
          fechaFinEstimada,
          saldoCapitalPendiente: valorTotalContrato,
          fechaAperturaPeriodoActual: fechaInicio,
        },
      });

      await tx.renegociacionContrato.create({
        data: {
          contratoAnteriorId,
          contratoNuevoId: contratoNuevo.id,
          deudaTrasladada,
          fecha: fechaInicio,
        },
      });

      nuevoContratoId = contratoNuevo.id;
    });
  } catch (error) {
    if (error instanceof MotoNoDisponibleError) {
      return { error: "Esa moto ya no está disponible. Elige otra." };
    }
    if (error instanceof ContratoAnteriorNoValidoError) {
      return { error: "El contrato anterior ya no es válido para renegociar (no está incumplido o es de otro cliente)." };
    }
    if (error instanceof YaRenegociadoError) {
      return { error: "Ese contrato ya fue renegociado antes en otro contrato nuevo." };
    }
    throw error;
  }

  revalidatePath("/contratos");
  revalidatePath("/motos");
  revalidatePath(`/contratos/${contratoAnteriorId}`);
  redirect(`/contratos/${nuevoContratoId}`);
}
