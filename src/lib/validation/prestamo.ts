import { z } from "zod";
import { fechaDesdeFormulario, pesosPositivosDesdeFormulario, textoOpcional } from "./helpers";

const cuid = z.string().min(1, "Selecciona un contrato");

/** Sentinela para "sin selección" en un <Select> de relación opcional (base-ui no admite value=""). */
export const SIN_SELECCION = "ninguna";

const idOpcionalDesdeSelect = z
  .string()
  .transform((v) => (v === SIN_SELECCION || v.trim() === "" ? undefined : v));

export const prestamoSchema = z.object({
  clienteId: z.string().min(1, "Selecciona un cliente"),
  fecha: fechaDesdeFormulario,
  montoOriginal: pesosPositivosDesdeFormulario,
  motocicletaId: idOpcionalDesdeSelect,
  motivo: textoOpcional,
});

export type PrestamoInput = z.infer<typeof prestamoSchema>;

export function parsePrestamoFormData(formData: FormData) {
  return prestamoSchema.safeParse({
    clienteId: formData.get("clienteId"),
    fecha: formData.get("fecha"),
    montoOriginal: formData.get("montoOriginal"),
    motocicletaId: formData.get("motocicletaId") ?? SIN_SELECCION,
    motivo: formData.get("motivo"),
  });
}

export const editarPrestamoSchema = z.object({
  fecha: fechaDesdeFormulario,
  motocicletaId: idOpcionalDesdeSelect,
  motivo: textoOpcional,
});

export type EditarPrestamoInput = z.infer<typeof editarPrestamoSchema>;

export function parseEditarPrestamoFormData(formData: FormData) {
  return editarPrestamoSchema.safeParse({
    fecha: formData.get("fecha"),
    motocicletaId: formData.get("motocicletaId") ?? SIN_SELECCION,
    motivo: formData.get("motivo"),
  });
}

export const abonoPrestamoSchema = z.object({
  fecha: fechaDesdeFormulario,
  monto: pesosPositivosDesdeFormulario,
  metodoPagoId: idOpcionalDesdeSelect,
});

export type AbonoPrestamoInput = z.infer<typeof abonoPrestamoSchema>;

export function parseAbonoPrestamoFormData(formData: FormData) {
  return abonoPrestamoSchema.safeParse({
    fecha: formData.get("fecha"),
    monto: formData.get("monto"),
    metodoPagoId: formData.get("metodoPagoId") ?? SIN_SELECCION,
  });
}

export const notaPrestamoSchema = z.object({
  contenido: z.string().trim().min(1, "Escribe una nota antes de guardar.").max(2000),
});

export function parseNotaPrestamoFormData(formData: FormData) {
  return notaPrestamoSchema.safeParse({ contenido: formData.get("contenido") });
}

export const transferenciaCapitalSchema = z.object({
  contratoId: cuid,
  fecha: fechaDesdeFormulario,
  monto: pesosPositivosDesdeFormulario,
  notas: textoOpcional,
});

export type TransferenciaCapitalInput = z.infer<typeof transferenciaCapitalSchema>;

export function parseTransferenciaCapitalFormData(formData: FormData) {
  return transferenciaCapitalSchema.safeParse({
    contratoId: formData.get("contratoId"),
    fecha: formData.get("fecha"),
    monto: formData.get("monto"),
    notas: formData.get("notas"),
  });
}
