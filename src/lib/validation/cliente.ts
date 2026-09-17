import { z } from "zod";
import { emailOpcional, textoOpcional } from "./helpers";

export const TIPOS_IDENTIFICACION = ["CC", "CE", "PASAPORTE", "NIT", "OTRO"] as const;

export const clienteSchema = z.object({
  nombreCompleto: z.string().trim().min(3, "Ingresa el nombre completo"),
  tipoIdentificacion: z.enum(TIPOS_IDENTIFICACION),
  numeroIdentificacion: z.string().trim().min(3, "Ingresa el número de identificación"),
  telefono: textoOpcional,
  email: emailOpcional,
  direccion: textoOpcional,
  notas: textoOpcional,
});

export type ClienteInput = z.infer<typeof clienteSchema>;

export function parseClienteFormData(formData: FormData) {
  return clienteSchema.safeParse({
    nombreCompleto: formData.get("nombreCompleto"),
    tipoIdentificacion: formData.get("tipoIdentificacion"),
    numeroIdentificacion: formData.get("numeroIdentificacion"),
    telefono: formData.get("telefono"),
    email: formData.get("email"),
    direccion: formData.get("direccion"),
    notas: formData.get("notas"),
  });
}
