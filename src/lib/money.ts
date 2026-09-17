/**
 * Toda la aritmética de dinero del proyecto pasa por aquí. Los montos son
 * siempre pesos colombianos enteros (sin decimales) — nunca `Float`/`Decimal`.
 * Ver docs/PROYECTO.md, sección "Decisiones técnicas".
 */

export type Pesos = number;

export function pesos(valor: number): Pesos {
  if (!Number.isInteger(valor)) {
    throw new Error(`Monto inválido: ${valor} no es un entero de pesos`);
  }
  return valor;
}

export function sumarPesos(...valores: Pesos[]): Pesos {
  return pesos(valores.reduce((total, v) => total + pesos(v), 0));
}

export function restarPesos(a: Pesos, b: Pesos): Pesos {
  return pesos(pesos(a) - pesos(b));
}

export function minPesos(a: Pesos, b: Pesos): Pesos {
  return pesos(Math.min(pesos(a), pesos(b)));
}

export function maxPesos(a: Pesos, b: Pesos): Pesos {
  return pesos(Math.max(pesos(a), pesos(b)));
}

const formatoCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatCOP(valor: Pesos): string {
  return formatoCOP.format(pesos(valor));
}
