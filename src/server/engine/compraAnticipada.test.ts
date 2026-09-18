import { describe, expect, it } from "vitest";
import { calcularCompraAnticipada } from "./compraAnticipada";

describe("calcularCompraAnticipada", () => {
  it("se rechaza si no alcanza a cubrir arriendo + saldo completo", () => {
    const resultado = calcularCompraAnticipada({
      arriendoFijoMensual: 350_000,
      moraAcumulada: 0,
      cobradoPeriodo: 4_000_000,
      saldoCapitalPendiente: 4_000_000,
    });

    expect(resultado).toEqual({ aceptada: false, montoFaltante: 350_000 });
  });

  it("se rechaza también considerando la mora acumulada", () => {
    const resultado = calcularCompraAnticipada({
      arriendoFijoMensual: 350_000,
      moraAcumulada: 100_000,
      cobradoPeriodo: 4_350_000,
      saldoCapitalPendiente: 4_000_000,
    });

    expect(resultado).toEqual({ aceptada: false, montoFaltante: 100_000 });
  });

  it("se acepta cuando cubre exactamente arriendo + saldo, sin excedente", () => {
    const resultado = calcularCompraAnticipada({
      arriendoFijoMensual: 350_000,
      moraAcumulada: 0,
      cobradoPeriodo: 4_350_000,
      saldoCapitalPendiente: 4_000_000,
    });

    expect(resultado).toEqual({
      aceptada: true,
      metaArriendo: 350_000,
      arriendoCubierto: 350_000,
      abonoCapital: 4_000_000,
      saldoCapitalNuevo: 0,
      excedenteNoAplicado: 0,
    });
  });

  it("se acepta con excedente registrado pero no aplicado", () => {
    const resultado = calcularCompraAnticipada({
      arriendoFijoMensual: 350_000,
      moraAcumulada: 0,
      cobradoPeriodo: 4_500_000,
      saldoCapitalPendiente: 4_000_000,
    });

    expect(resultado).toEqual({
      aceptada: true,
      metaArriendo: 350_000,
      arriendoCubierto: 350_000,
      abonoCapital: 4_000_000,
      saldoCapitalNuevo: 0,
      excedenteNoAplicado: 150_000,
    });
  });
});
