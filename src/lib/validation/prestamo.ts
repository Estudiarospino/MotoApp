import { z } from "zod";
import { fechaDesdeFormulario, pesosPositivosDesdeFormulario, textoOpcional } from "./helpers";

export const prestamoSchema = z.object({
  clienteId: z.string().min(1, "Selecciona un cliente"),
  fecha: fechaDesdeFormulario,
  montoOriginal: pesosPositivosDesdeFormulario,
  motivo: textoOpcional,
});

export type PrestamoInput = z.infer<typeof prestamoSchema>;

export function parsePrestamoFormData(formData: FormData) {
  return prestamoSchema.safeParse({
    clienteId: formData.get("clienteId"),
    fecha: formData.get("fecha"),
    montoOriginal: formData.get("montoOriginal"),
    motivo: formData.get("motivo"),
  });
}

export const abonoPrestamoSchema = z.object({
  fecha: fechaDesdeFormulario,
  monto: pesosPositivosDesdeFormulario,
});

export type AbonoPrestamoInput = z.infer<typeof abonoPrestamoSchema>;

export function parseAbonoPrestamoFormData(formData: FormData) {
  return abonoPrestamoSchema.safeParse({
    fecha: formData.get("fecha"),
    monto: formData.get("monto"),
  });
}
