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

export const UMBRAL_PERIODO_ABIERTO_DIAS = 35;
