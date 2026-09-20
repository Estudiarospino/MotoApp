import { z } from "zod";
import {
  fechaDesdeFormulario,
  fechaOpcionalDesdeFormulario,
  pesosDesdeFormulario,
  pesosOpcionalDesdeFormulario,
  pesosPositivosDesdeFormulario,
} from "./helpers";

const cuid = z.string().min(1, "Selecciona una opción");

export const FRECUENCIAS_PAGO = ["DIARIO", "SEMANAL", "QUINCENAL", "MENSUAL"] as const;

/** Campos comunes a la creación y edición: los términos financieros del contrato. */
const terminosContratoSchema = {
  valorTotalContrato: pesosPositivosDesdeFormulario,
  arriendoFijoMensual: pesosPositivosDesdeFormulario,
  metaMensualReferencia: pesosOpcionalDesdeFormulario,
  cuotaDiariaReferencia: pesosOpcionalDesdeFormulario,
  frecuenciaPago: z.enum(FRECUENCIAS_PAGO).default("MENSUAL"),
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
    frecuenciaPago: formData.get("frecuenciaPago") || undefined,
    fechaFinEstimada: formData.get("fechaFinEstimada"),
  });
}

/** Renegociación: crea un contrato nuevo trasladándole la deuda de uno INCUMPLIDO_RECUPERADA. */
export const renegociarContratoSchema = z.object({
  contratoAnteriorId: cuid,
  clienteId: cuid,
  motocicletaId: cuid,
  fechaInicio: fechaDesdeFormulario,
  deudaTrasladada: pesosDesdeFormulario,
  ...terminosContratoSchema,
});

export type RenegociarContratoInput = z.infer<typeof renegociarContratoSchema>;

export function parseRenegociarContratoFormData(formData: FormData) {
  return renegociarContratoSchema.safeParse({
    contratoAnteriorId: formData.get("contratoAnteriorId"),
    clienteId: formData.get("clienteId"),
    motocicletaId: formData.get("motocicletaId"),
    fechaInicio: formData.get("fechaInicio"),
    deudaTrasladada: formData.get("deudaTrasladada"),
    valorTotalContrato: formData.get("valorTotalContrato"),
    arriendoFijoMensual: formData.get("arriendoFijoMensual"),
    metaMensualReferencia: formData.get("metaMensualReferencia"),
    cuotaDiariaReferencia: formData.get("cuotaDiariaReferencia"),
    frecuenciaPago: formData.get("frecuenciaPago") || undefined,
    fechaFinEstimada: formData.get("fechaFinEstimada"),
  });
}

/**
 * En edición no se puede reasignar cliente ni moto (para eso existe la
 * renegociación, que crea un contrato nuevo trazable). El resto de los
 * términos, incluido el valor total y el saldo de capital pendiente, sí se
 * pueden corregir — el saldo es un ajuste manual explícito del administrador.
 */
export const editarContratoSchema = z.object({
  fechaInicio: fechaDesdeFormulario,
  valorTotalContrato: pesosPositivosDesdeFormulario,
  saldoCapitalPendiente: pesosDesdeFormulario,
  arriendoFijoMensual: pesosPositivosDesdeFormulario,
  metaMensualReferencia: pesosOpcionalDesdeFormulario,
  cuotaDiariaReferencia: pesosOpcionalDesdeFormulario,
  frecuenciaPago: z.enum(FRECUENCIAS_PAGO).default("MENSUAL"),
  fechaFinEstimada: fechaOpcionalDesdeFormulario,
});

export type EditarContratoInput = z.infer<typeof editarContratoSchema>;

export function parseEditarContratoFormData(formData: FormData) {
  return editarContratoSchema.safeParse({
    fechaInicio: formData.get("fechaInicio"),
    valorTotalContrato: formData.get("valorTotalContrato"),
    saldoCapitalPendiente: formData.get("saldoCapitalPendiente"),
    arriendoFijoMensual: formData.get("arriendoFijoMensual"),
    metaMensualReferencia: formData.get("metaMensualReferencia"),
    cuotaDiariaReferencia: formData.get("cuotaDiariaReferencia"),
    frecuenciaPago: formData.get("frecuenciaPago") || undefined,
    fechaFinEstimada: formData.get("fechaFinEstimada"),
  });
}
