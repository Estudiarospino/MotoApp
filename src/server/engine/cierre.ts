/**
 * Motor de cierre — capa pura. Sin I/O ni Prisma: recibe y devuelve enteros
 * de pesos exactos. Ver docs/PROYECTO.md, sección "Algoritmo de cierre de
 * periodo".
 */
import { type Pesos, minPesos, pesos, restarPesos, sumarPesos } from "@/lib/money";

export type EntradaCierre = {
  arriendoFijoMensual: Pesos;
  moraAcumulada: Pesos;
  cobradoPeriodo: Pesos;
  saldoCapitalPendiente: Pesos;
};

export type ResultadoCierre = {
  metaArriendo: Pesos;
  arriendoCubierto: Pesos;
  abonoCapital: Pesos;
  moraNueva: Pesos;
  saldoCapitalNuevo: Pesos;
  /** true cuando el abono a capital de este cierre agota el saldo pendiente. */
  contratoFinalizado: boolean;
};

export function calcularCierrePeriodo(entrada: EntradaCierre): ResultadoCierre {
  const metaArriendo = sumarPesos(entrada.arriendoFijoMensual, entrada.moraAcumulada);

  if (entrada.cobradoPeriodo >= metaArriendo) {
    const excedente = restarPesos(entrada.cobradoPeriodo, metaArriendo);
    const abonoCapital = minPesos(excedente, entrada.saldoCapitalPendiente);
    const saldoCapitalNuevo = restarPesos(entrada.saldoCapitalPendiente, abonoCapital);

    return {
      metaArriendo,
      arriendoCubierto: metaArriendo,
      abonoCapital,
      moraNueva: pesos(0),
      saldoCapitalNuevo,
      contratoFinalizado: saldoCapitalNuevo === 0,
    };
  }

  return {
    metaArriendo,
    arriendoCubierto: entrada.cobradoPeriodo,
    abonoCapital: pesos(0),
    moraNueva: restarPesos(metaArriendo, entrada.cobradoPeriodo),
    saldoCapitalNuevo: entrada.saldoCapitalPendiente,
    contratoFinalizado: false,
  };
}

