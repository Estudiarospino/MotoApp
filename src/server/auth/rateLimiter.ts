import "server-only";

/**
 * Limitador de intentos de login en memoria. Alcanza para este caso (una sola
 * instancia, un solo usuario admin) — no está pensado para sobrevivir un
 * reinicio del proceso ni para desplegarse en múltiples instancias.
 */
const MAX_INTENTOS = 5;
const VENTANA_BLOQUEO_MS = 15 * 60 * 1000; // 15 minutos

const intentosFallidos = new Map<string, { conteo: number; bloqueadoHasta: number }>();

export function estaBloqueado(clave: string): boolean {
  const registro = intentosFallidos.get(clave);
  if (!registro) return false;
  if (registro.bloqueadoHasta > Date.now()) return true;
  intentosFallidos.delete(clave);
  return false;
}

export function registrarIntentoFallido(clave: string): void {
  const registro = intentosFallidos.get(clave) ?? { conteo: 0, bloqueadoHasta: 0 };
  registro.conteo += 1;
  if (registro.conteo >= MAX_INTENTOS) {
    registro.bloqueadoHasta = Date.now() + VENTANA_BLOQUEO_MS;
    registro.conteo = 0;
  }
  intentosFallidos.set(clave, registro);
}

export function limpiarIntentos(clave: string): void {
  intentosFallidos.delete(clave);
}
