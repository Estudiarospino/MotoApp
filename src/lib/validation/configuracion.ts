import { z } from "zod";
import { pesosDesdeFormulario, textoOpcional } from "./helpers";

const cuid = z.string().min(1, "Selecciona una opción");

export const cuentaSchema = z.object({
  nombre: z.string().trim().min(1, "Escribe un nombre para la cuenta.").max(120),
  titular: z.string().trim().min(1, "Escribe el titular de la cuenta.").max(120),
  banco: textoOpcional,
  numeroCuenta: textoOpcional,
  saldoInicial: pesosDesdeFormulario,
});

export type CuentaInput = z.infer<typeof cuentaSchema>;

export function parseCuentaFormData(formData: FormData) {
  return cuentaSchema.safeParse({
    nombre: formData.get("nombre"),
    titular: formData.get("titular"),
    banco: formData.get("banco"),
    numeroCuenta: formData.get("numeroCuenta"),
    saldoInicial: formData.get("saldoInicial"),
  });
}

export const metodoPagoSchema = z.object({
  nombre: z.string().trim().min(1, "Escribe un nombre para el método de pago.").max(120),
  cuentaId: cuid,
});

export type MetodoPagoInput = z.infer<typeof metodoPagoSchema>;

export function parseMetodoPagoFormData(formData: FormData) {
  return metodoPagoSchema.safeParse({
    nombre: formData.get("nombre"),
    cuentaId: formData.get("cuentaId"),
  });
}
