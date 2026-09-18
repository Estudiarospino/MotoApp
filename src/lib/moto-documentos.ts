/**
 * SOAT y revisión tecnomecánica: solo se guarda la fecha de expedición
 * (`Motocicleta.soatFechaExpedicion` / `tecnomecanicaFechaExpedicion`); el
 * vencimiento siempre se calcula a partir de ella, nunca se almacena.
 *
 * Asunción a confirmar con el usuario: vigencia de 12 meses para ambos
 * documentos desde su fecha de expedición. Si la norma cambia o es distinta
 * para algún caso, ajustar aquí — es el único lugar donde vive esta regla.
 */
export const VIGENCIA_SOAT_MESES = 12;
export const VIGENCIA_TECNOMECANICA_MESES = 12;
export const UMBRAL_ALERTA_VENCIMIENTO_DIAS = 30;

export function calcularVencimiento(fechaExpedicion: Date, meses: number): Date {
  const vencimiento = new Date(fechaExpedicion);
  vencimiento.setUTCMonth(vencimiento.getUTCMonth() + meses);
  return vencimiento;
}

export type EstadoVencimiento = {
  label: string;
  variant: "success" | "warning" | "destructive" | "secondary";
  vencimiento: Date | null;
};

export function estadoVencimiento(fechaExpedicion: Date | null, meses: number): EstadoVencimiento {
  if (!fechaExpedicion) {
    return { label: "Sin registrar", variant: "secondary", vencimiento: null };
  }

  const vencimiento = calcularVencimiento(fechaExpedicion, meses);
  const diasRestantes = Math.floor((vencimiento.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

  if (diasRestantes < 0) {
    return { label: "Vencido", variant: "destructive", vencimiento };
  }
  if (diasRestantes <= UMBRAL_ALERTA_VENCIMIENTO_DIAS) {
    return { label: `Vence en ${diasRestantes} días`, variant: "warning", vencimiento };
  }
  return { label: "Vigente", variant: "success", vencimiento };
}

function requiereAtencion(estado: EstadoVencimiento): boolean {
  // "Sin registrar" no genera alerta — solo lo que sabemos que está vencido o por vencer.
  return estado.variant === "destructive" || estado.variant === "warning";
}

/** true si SOAT o tecnomecánica están vencidos o dentro del umbral de alerta. */
export function motoNecesitaAtencionDocumentos(moto: {
  soatFechaExpedicion: Date | null;
  tecnomecanicaFechaExpedicion: Date | null;
}): boolean {
  const soat = estadoVencimiento(moto.soatFechaExpedicion, VIGENCIA_SOAT_MESES);
  const tecno = estadoVencimiento(moto.tecnomecanicaFechaExpedicion, VIGENCIA_TECNOMECANICA_MESES);
  return requiereAtencion(soat) || requiereAtencion(tecno);
}
