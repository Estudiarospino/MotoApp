/**
 * Abono directo a capital — capa pura. A diferencia del cierre de periodo,
 * nunca pasa por `cobradoPeriodo` ni afecta la mora: reduce el saldo de
 * capital de inmediato. Ver docs/PROYECTO.md.
 */
import { type Pesos, pesos, restarPesos } from "@/lib/money";

export class MontoExcedeSaldoError extends Error {}

export type EntradaAbonoCapital = {
  saldoCapitalPendiente: Pesos;
  monto: Pesos;
};

export type ResultadoAbonoCapital = {
  saldoCapitalNuevo: Pesos;
  contratoFinalizado: boolean;
};

export function calcularAbonoCapital(entrada: EntradaAbonoCapital): ResultadoAbonoCapital {
  if (entrada.monto > entrada.saldoCapitalPendiente) {
    throw new MontoExcedeSaldoError();
  }

  const saldoCapitalNuevo = restarPesos(entrada.saldoCapitalPendiente, entrada.monto);
  return { saldoCapitalNuevo, contratoFinalizado: saldoCapitalNuevo === pesos(0) };
}
