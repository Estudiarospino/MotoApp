import { z } from "zod";
import { pesosPositivosDesdeFormulario, textoOpcional } from "./helpers";

export const motocicletaSchema = z.object({
  marca: z.string().trim().min(1, "Ingresa la marca"),
  modelo: z.string().trim().min(1, "Ingresa el modelo"),
  placa: z
    .string()
    .trim()
    .toUpperCase()
    .min(5, "Ingresa una placa válida"),
  color: textoOpcional,
  anioModelo: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.coerce.number().int().min(1990).max(2100).optional(),
  ),
  precioInicial: pesosPositivosDesdeFormulario,
  notas: textoOpcional,
});

export type MotocicletaInput = z.infer<typeof motocicletaSchema>;

export function parseMotocicletaFormData(formData: FormData) {
  return motocicletaSchema.safeParse({
    marca: formData.get("marca"),
    modelo: formData.get("modelo"),
    placa: formData.get("placa"),
    color: formData.get("color"),
    anioModelo: formData.get("anioModelo"),
    precioInicial: formData.get("precioInicial"),
    notas: formData.get("notas"),
  });
}
