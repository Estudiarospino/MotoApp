import { describe, expect, it } from "vitest";
import { calcularCierrePeriodo } from "./cierre";

describe("calcularCierrePeriodo", () => {
  it("pago exacto: cubre la meta sin excedente ni mora", () => {
    const resultado = calcularCierrePeriodo({
      arriendoFijoMensual: 350_000,
      moraAcumulada: 0,
      cobradoPeriodo: 350_000,
      saldoCapitalPendiente: 5_000_000,
    });

    expect(resultado).toEqual({
      metaArriendo: 350_000,
      arriendoCubierto: 350_000,
      abonoCapital: 0,
      moraNueva: 0,
      saldoCapitalNuevo: 5_000_000,
      contratoFinalizado: false,
    });
  });

  it("cobro insuficiente: arriendo parcial y mora nueva por la diferencia", () => {
    const resultado = calcularCierrePeriodo({
      arriendoFijoMensual: 350_000,
      moraAcumulada: 0,
      cobradoPeriodo: 200_000,
      saldoCapitalPendiente: 5_000_000,
    });

    expect(resultado).toEqual({
      metaArriendo: 350_000,
      arriendoCubierto: 200_000,
      abonoCapital: 0,
      moraNueva: 150_000,
      saldoCapitalNuevo: 5_000_000,
      contratoFinalizado: false,
    });
  });

  it("cobro cero: toda la meta se vuelve mora", () => {
    const resultado = calcularCierrePeriodo({
      arriendoFijoMensual: 350_000,
      moraAcumulada: 0,
      cobradoPeriodo: 0,
      saldoCapitalPendiente: 5_000_000,
    });

    expect(resultado).toEqual({
      metaArriendo: 350_000,
      arriendoCubierto: 0,
      abonoCapital: 0,
      moraNueva: 350_000,
      saldoCapitalNuevo: 5_000_000,
      contratoFinalizado: false,
    });
  });

  it("excedente sobre la meta: abona a capital", () => {
    const resultado = calcularCierrePeriodo({
      arriendoFijoMensual: 350_000,
      moraAcumulada: 0,
      cobradoPeriodo: 500_000,
      saldoCapitalPendiente: 5_000_000,
    });

    expect(resultado).toEqual({
      metaArriendo: 350_000,
      arriendoCubierto: 350_000,
      abonoCapital: 150_000,
      moraNueva: 0,
      saldoCapitalNuevo: 4_850_000,
      contratoFinalizado: false,
    });
  });

  it("mora previa arrastrada: se suma a la meta del periodo", () => {
    const resultado = calcularCierrePeriodo({
      arriendoFijoMensual: 350_000,
      moraAcumulada: 150_000,
      cobradoPeriodo: 500_000,
      saldoCapitalPendiente: 5_000_000,
    });

    expect(resultado).toEqual({
      metaArriendo: 500_000,
      arriendoCubierto: 500_000,
      abonoCapital: 0,
      moraNueva: 0,
      saldoCapitalNuevo: 5_000_000,
      contratoFinalizado: false,
    });
  });

  it("mora previa que no alcanza a cubrirse: sigue creciendo", () => {
    const resultado = calcularCierrePeriodo({
      arriendoFijoMensual: 350_000,
      moraAcumulada: 150_000,
      cobradoPeriodo: 300_000,
      saldoCapitalPendiente: 5_000_000,
    });

    expect(resultado).toEqual({
      metaArriendo: 500_000,
      arriendoCubierto: 300_000,
      abonoCapital: 0,
      moraNueva: 200_000,
      saldoCapitalNuevo: 5_000_000,
      contratoFinalizado: false,
    });
  });

  it("el abono a capital nunca excede el saldo pendiente, aunque sobre dinero", () => {
    const resultado = calcularCierrePeriodo({
      arriendoFijoMensual: 350_000,
      moraAcumulada: 0,
      cobradoPeriodo: 550_000,
      saldoCapitalPendiente: 100_000,
    });

    expect(resultado).toEqual({
      metaArriendo: 350_000,
      arriendoCubierto: 350_000,
      abonoCapital: 100_000,
      moraNueva: 0,
      saldoCapitalNuevo: 0,
      contratoFinalizado: true,
    });
  });

  it("cierre que agota el capital exacto: contrato finalizado", () => {
    const resultado = calcularCierrePeriodo({
      arriendoFijoMensual: 350_000,
      moraAcumulada: 0,
      cobradoPeriodo: 450_000,
      saldoCapitalPendiente: 100_000,
    });

    expect(resultado).toEqual({
      metaArriendo: 350_000,
      arriendoCubierto: 350_000,
      abonoCapital: 100_000,
      moraNueva: 0,
      saldoCapitalNuevo: 0,
      contratoFinalizado: true,
    });
  });
});
