/**
 * Variante del motor de cierre para la compra anticipada: el cliente paga de
 * una vez el saldo de capital restante. Si lo recaudado no cubre arriendo +
 * capital completo, se rechaza (nunca se deja el contrato "a medias").
 */
import { type Pesos, pesos, restarPesos, sumarPesos } from "@/lib/money";

export type EntradaCompraAnticipada = {
  arriendoFijoMensual: Pesos;
  moraAcumulada: Pesos;
  cobradoPeriodo: Pesos;
  saldoCapitalPendiente: Pesos;
};

export type ResultadoCompraAnticipada =
  | {
      aceptada: true;
      metaArriendo: Pesos;
      arriendoCubierto: Pesos;
      abonoCapital: Pesos;
      saldoCapitalNuevo: Pesos;
      excedenteNoAplicado: Pesos;
    }
  | {
      aceptada: false;
      montoFaltante: Pesos;
    };

export function calcularCompraAnticipada(entrada: EntradaCompraAnticipada): ResultadoCompraAnticipada {
  const metaArriendo = sumarPesos(entrada.arriendoFijoMensual, entrada.moraAcumulada);
  const totalRequerido = sumarPesos(metaArriendo, entrada.saldoCapitalPendiente);

  if (entrada.cobradoPeriodo < totalRequerido) {
    return { aceptada: false, montoFaltante: restarPesos(totalRequerido, entrada.cobradoPeriodo) };
  }

  return {
    aceptada: true,
    metaArriendo,
    arriendoCubierto: metaArriendo,
    abonoCapital: entrada.saldoCapitalPendiente,
    saldoCapitalNuevo: pesos(0),
    excedenteNoAplicado: restarPesos(entrada.cobradoPeriodo, totalRequerido),
  };
}
