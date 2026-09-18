import { z } from "zod";
import { fechaDesdeFormulario, pesosPositivosDesdeFormulario, textoOpcional } from "./helpers";

const cuid = z.string().min(1, "Selecciona un método de pago");

export const TIPOS_PAGO = ["ARRIENDO", "ABONO_CAPITAL"] as const;

export const pagoSchema = z.object({
  tipo: z.enum(TIPOS_PAGO).default("ARRIENDO"),
  fecha: fechaDesdeFormulario,
  monto: pesosPositivosDesdeFormulario,
  metodoPagoId: cuid,
  referencia: textoOpcional,
  notas: textoOpcional,
});

export type PagoInput = z.infer<typeof pagoSchema>;

export function parsePagoFormData(formData: FormData) {
  return pagoSchema.safeParse({
    tipo: formData.get("tipo") || undefined,
    fecha: formData.get("fecha"),
    monto: formData.get("monto"),
    metodoPagoId: formData.get("metodoPagoId"),
    referencia: formData.get("referencia"),
    notas: formData.get("notas"),
  });
}
