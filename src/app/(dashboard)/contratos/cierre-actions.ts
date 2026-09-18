"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { formatCOP } from "@/lib/money";
import {
  ConflictoConcurrenciaError,
  ContratoNoActivoError,
  cerrarPeriodoNormal,
  cerrarPorIncumplimiento,
} from "@/server/engine/cierreService";
import { ejecutarCompraAnticipada } from "@/server/engine/compraAnticipadaService";

export type AccionCierreState = { error?: string; ok?: boolean };

function mensajeErrorCierre(error: unknown): string {
  if (error instanceof ContratoNoActivoError) {
    return "Este contrato ya no está activo.";
  }
  if (error instanceof ConflictoConcurrenciaError) {
    return "Otra operación modificó este contrato al mismo tiempo. Vuelve a intentarlo.";
  }
  throw error;
}

function revalidarTrasCierre(contratoId: string) {
  revalidatePath(`/contratos/${contratoId}`);
  revalidatePath("/contratos");
  revalidatePath("/motos");
  revalidatePath("/pagos");
  revalidatePath("/");
}

/** Vacío = usar el arriendo fijo del contrato; si viene, es un override puntual solo para este cierre. */
const arriendoOverrideSchema = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.coerce.number().int("Debe ser un número entero").nonnegative("No puede ser negativo").optional(),
);

export async function cerrarPeriodoAction(
  contratoId: string,
  _prevState: AccionCierreState,
  formData: FormData,
): Promise<AccionCierreState> {
  const parsedArriendo = arriendoOverrideSchema.safeParse(formData.get("arriendoFijoUsado"));
  if (!parsedArriendo.success) {
    return { error: "El arriendo a usar debe ser un número entero mayor o igual a cero." };
  }

  try {
    await cerrarPeriodoNormal(contratoId, parsedArriendo.data);
  } catch (error) {
    return { error: mensajeErrorCierre(error) };
  }

  revalidarTrasCierre(contratoId);
  return { ok: true };
}

export async function marcarIncumplimientoAction(
  contratoId: string,
  _prevState: AccionCierreState,
  formData: FormData,
): Promise<AccionCierreState> {
  const parsedArriendo = arriendoOverrideSchema.safeParse(formData.get("arriendoFijoUsado"));
  if (!parsedArriendo.success) {
    return { error: "El arriendo a usar debe ser un número entero mayor o igual a cero." };
  }

  try {
    await cerrarPorIncumplimiento(contratoId, parsedArriendo.data);
  } catch (error) {
    return { error: mensajeErrorCierre(error) };
  }

  revalidarTrasCierre(contratoId);
  return { ok: true };
}

export async function compraAnticipadaAction(
  contratoId: string,
  _prevState: AccionCierreState,
  _formData: FormData,
): Promise<AccionCierreState> {
  try {
    const resultado = await ejecutarCompraAnticipada(contratoId);
    if (!resultado.aceptada) {
      return {
        error: `Lo recaudado no alcanza para la compra anticipada. Falta ${formatCOP(resultado.montoFaltante)}.`,
      };
    }
  } catch (error) {
    return { error: mensajeErrorCierre(error) };
  }

  revalidarTrasCierre(contratoId);
  return {};
}
