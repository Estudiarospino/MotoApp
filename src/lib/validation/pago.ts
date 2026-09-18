import { z } from "zod";
import { fechaDesdeFormulario, pesosPositivosDesdeFormulario, textoOpcional } from "./helpers";

export const METODOS_PAGO = ["TRANSFERENCIA", "EFECTIVO", "OTRO"] as const;

export const pagoSchema = z.object({
  fecha: fechaDesdeFormulario,
  monto: pesosPositivosDesdeFormulario,
  metodo: z.enum(METODOS_PAGO),
  referencia: textoOpcional,
  notas: textoOpcional,
});

export type PagoInput = z.infer<typeof pagoSchema>;

export function parsePagoFormData(formData: FormData) {
  return pagoSchema.safeParse({
    fecha: formData.get("fecha"),
    monto: formData.get("monto"),
    metodo: formData.get("metodo"),
    referencia: formData.get("referencia"),
    notas: formData.get("notas"),
  });
}
