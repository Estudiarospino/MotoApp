/** % de cambio entre dos periodos para tarjetas de estadísticas. `null` cuando no hay base de comparación. */
export function calcularTendenciaPct(actual: number, anterior: number): number | null {
  if (anterior === 0) return actual === 0 ? 0 : null;
  return Math.round(((actual - anterior) / anterior) * 100);
}
