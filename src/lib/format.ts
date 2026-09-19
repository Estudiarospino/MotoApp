export function formatFolioContrato(folio: number): string {
  return `CT-${folio.toString().padStart(4, "0")}`;
}

/** Prestamo no tiene folio en la base de datos: se deriva de su posición cronológica de creación. */
export function formatFolioPrestamo(posicion: number): string {
  return `PRE-${posicion.toString().padStart(3, "0")}`;
}

const formatoFecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeZone: "UTC" });

export function formatFecha(fecha: Date): string {
  return formatoFecha.format(fecha);
}

const formatoFechaLarga = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** Formato largo ("1 de julio de 2026"), usado donde la fecha es el dato protagonista. */
export function formatFechaLarga(fecha: Date): string {
  return formatoFechaLarga.format(fecha);
}

/** Formatea un `Date` como valor para <input type="date"> (YYYY-MM-DD, en UTC). */
export function toFechaInputValue(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

/** Días transcurridos desde `fecha` hasta ahora (redondeado hacia abajo, mínimo 0). */
export function diasDesde(fecha: Date): number {
  const dias = Math.floor((Date.now() - fecha.getTime()) / (24 * 60 * 60 * 1000));
  return Math.max(dias, 0);
}
