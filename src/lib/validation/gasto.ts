import { z } from "zod";
import { fechaDesdeFormulario, pesosPositivosDesdeFormulario } from "./helpers";

export const CATEGORIAS_GASTO = [
  "MANTENIMIENTO",
  "REPARACION",
  "SEGURO",
  "IMPUESTOS",
  "OTRO",
] as const;

export const gastoSchema = z.object({
  motocicletaId: z.string().min(1, "Selecciona una moto"),
  fecha: fechaDesdeFormulario,
  categoria: z.enum(CATEGORIAS_GASTO),
  descripcion: z.string().trim().min(1, "Ingresa una descripción"),
  monto: pesosPositivosDesdeFormulario,
});

export type GastoInput = z.infer<typeof gastoSchema>;

export function parseGastoFormData(formData: FormData) {
  return gastoSchema.safeParse({
    motocicletaId: formData.get("motocicletaId"),
    fecha: formData.get("fecha"),
    categoria: formData.get("categoria"),
    descripcion: formData.get("descripcion"),
    monto: formData.get("monto"),
  });
}
