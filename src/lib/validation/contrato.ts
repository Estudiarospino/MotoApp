import { z } from "zod";
import {
  fechaDesdeFormulario,
  fechaOpcionalDesdeFormulario,
  pesosOpcionalDesdeFormulario,
  pesosPositivosDesdeFormulario,
} from "./helpers";

const cuid = z.string().min(1, "Selecciona una opción");

/** Campos comunes a la creación y edición: los términos financieros del contrato. */
const terminosContratoSchema = {
  valorTotalContrato: pesosPositivosDesdeFormulario,
  arriendoFijoMensual: pesosPositivosDesdeFormulario,
  metaMensualReferencia: pesosOpcionalDesdeFormulario,
  cuotaDiariaReferencia: pesosOpcionalDesdeFormulario,
  fechaFinEstimada: fechaOpcionalDesdeFormulario,
};

export const crearContratoSchema = z.object({
  clienteId: cuid,
  motocicletaId: cuid,
  fechaInicio: fechaDesdeFormulario,
  ...terminosContratoSchema,
});

export type CrearContratoInput = z.infer<typeof crearContratoSchema>;

export function parseCrearContratoFormData(formData: FormData) {
  return crearContratoSchema.safeParse({
    clienteId: formData.get("clienteId"),
    motocicletaId: formData.get("motocicletaId"),
    fechaInicio: formData.get("fechaInicio"),
    valorTotalContrato: formData.get("valorTotalContrato"),
    arriendoFijoMensual: formData.get("arriendoFijoMensual"),
    metaMensualReferencia: formData.get("metaMensualReferencia"),
    cuotaDiariaReferencia: formData.get("cuotaDiariaReferencia"),
    fechaFinEstimada: formData.get("fechaFinEstimada"),
  });
}

/**
 * En edición no se puede cambiar cliente, moto, fecha de inicio ni el valor
 * total del contrato (ya fijó el saldo de capital inicial). Solo se corrigen
 * los términos que alimentan o acompañan el motor de cierre.
 */
export const editarContratoSchema = z.object({
  arriendoFijoMensual: pesosPositivosDesdeFormulario,
  metaMensualReferencia: pesosOpcionalDesdeFormulario,
  cuotaDiariaReferencia: pesosOpcionalDesdeFormulario,
  fechaFinEstimada: fechaOpcionalDesdeFormulario,
});

export type EditarContratoInput = z.infer<typeof editarContratoSchema>;

export function parseEditarContratoFormData(formData: FormData) {
  return editarContratoSchema.safeParse({
    arriendoFijoMensual: formData.get("arriendoFijoMensual"),
    metaMensualReferencia: formData.get("metaMensualReferencia"),
    cuotaDiariaReferencia: formData.get("cuotaDiariaReferencia"),
    fechaFinEstimada: formData.get("fechaFinEstimada"),
  });
}
