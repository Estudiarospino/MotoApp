/**
 * Traslado de saldo de préstamo a capital de contrato — capa pura. No entra
 * dinero nuevo: el saldo del préstamo baja y el capital del contrato sube en
 * la misma cantidad (ver transferenciaCapitalService.ts).
 */
import { type Pesos, pesos, restarPesos } from "@/lib/money";

export class MontoExcedeSaldoPrestamoError extends Error {}

export type EntradaTransferencia = {
  saldoPrestamoPendiente: Pesos;
  monto: Pesos;
};

export type ResultadoTransferencia = {
  saldoPrestamoNuevo: Pesos;
  prestamoPagado: boolean;
};

export function calcularTransferenciaCapital(entrada: EntradaTransferencia): ResultadoTransferencia {
  if (entrada.monto > entrada.saldoPrestamoPendiente) {
    throw new MontoExcedeSaldoPrestamoError();
  }

  const saldoPrestamoNuevo = restarPesos(entrada.saldoPrestamoPendiente, entrada.monto);
  return { saldoPrestamoNuevo, prestamoPagado: saldoPrestamoNuevo === pesos(0) };
}
