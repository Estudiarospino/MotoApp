"use server";

import { revalidatePath } from "next/cache";
import { formatCOP } from "@/lib/money";
import {
  ConflictoConcurrenciaError,
  ContratoNoActivoError,
  cerrarPeriodoNormal,
  cerrarPorIncumplimiento,
} from "@/server/engine/cierreService";
import { ejecutarCompraAnticipada } from "@/server/engine/compraAnticipadaService";

export type AccionCierreState = { error?: string };

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
}

export async function cerrarPeriodoAction(
  contratoId: string,
  _prevState: AccionCierreState,
  _formData: FormData,
): Promise<AccionCierreState> {
  try {
    await cerrarPeriodoNormal(contratoId);
  } catch (error) {
    return { error: mensajeErrorCierre(error) };
  }

  revalidarTrasCierre(contratoId);
  return {};
}

export async function marcarIncumplimientoAction(
  contratoId: string,
  _prevState: AccionCierreState,
  _formData: FormData,
): Promise<AccionCierreState> {
  try {
    await cerrarPorIncumplimiento(contratoId);
  } catch (error) {
    return { error: mensajeErrorCierre(error) };
  }

  revalidarTrasCierre(contratoId);
  return {};
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
