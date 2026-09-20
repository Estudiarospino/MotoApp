import { diasDesde } from "@/lib/format";

const ESTADO_LABEL = {
  FINALIZADO_PAGADO: "Finalizado (pagado)",
  FINALIZADO_COMPRADO: "Finalizado (compra anticipada)",
  INCUMPLIDO_RECUPERADA: "Incumplido / recuperada",
} as const;

export type EstadoContratoInfo = {
  label: string;
  variant: "success" | "warning" | "destructive" | "secondary";
};

/** Estado visual del contrato: combina `estado` con `moraAcumulada` para distinguir "activo al día" de "activo en mora". */
export function estadoContratoInfo(contrato: { estado: string; moraAcumulada: number }): EstadoContratoInfo {
  if (contrato.estado === "ACTIVO") {
    return contrato.moraAcumulada > 0
      ? { label: "En mora", variant: "warning" }
      : { label: "Al día", variant: "success" };
  }
  if (contrato.estado === "INCUMPLIDO_RECUPERADA") {
    return { label: ESTADO_LABEL.INCUMPLIDO_RECUPERADA, variant: "destructive" };
  }
  return {
    label: ESTADO_LABEL[contrato.estado as "FINALIZADO_PAGADO" | "FINALIZADO_COMPRADO"],
    variant: "secondary",
  };
}

/**
 * Umbral de días sin pagar antes de considerar el contrato en atraso, según la
 * frecuencia de pago pactada — no un número fijo para todos los contratos.
 */
const DIAS_POR_FRECUENCIA: Record<string, number> = {
  DIARIO: 1,
  SEMANAL: 7,
  QUINCENAL: 15,
  MENSUAL: 30,
};

export function umbralDiasPago(frecuenciaPago: string): number {
  return DIAS_POR_FRECUENCIA[frecuenciaPago] ?? DIAS_POR_FRECUENCIA.MENSUAL;
}

/**
 * Días desde el último pago recibido (de cualquier tipo). Si el contrato
 * todavía no tiene ningún pago, se cuenta desde `fechaInicio`. A propósito no
 * usa `fechaAperturaPeriodoActual`: esa fecha solo se mueve cuando alguien
 * cierra el periodo a mano, así que un contrato al que le pagan puntual pero
 * cuyo periodo no se ha cerrado en meses igual mostraría "días" altísimos.
 */
export function diasSinPagar(contrato: { fechaInicio: Date; ultimoPagoFecha: Date | null }): number {
  return diasDesde(contrato.ultimoPagoFecha ?? contrato.fechaInicio);
}

/** true cuando el contrato lleva sin pagar más días de los que permite su frecuencia pactada. */
export function contratoEnAtrasoCritico(contrato: {
  frecuenciaPago: string;
  fechaInicio: Date;
  ultimoPagoFecha: Date | null;
}): boolean {
  return diasSinPagar(contrato) > umbralDiasPago(contrato.frecuenciaPago);
}
