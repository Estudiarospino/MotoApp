import { describe, expect, it } from "vitest";
import { calcularAbonoCapital, MontoExcedeSaldoError } from "./abonoCapital";

describe("calcularAbonoCapital", () => {
  it("abono parcial: reduce el saldo sin finalizar el contrato", () => {
    const resultado = calcularAbonoCapital({ saldoCapitalPendiente: 5_000_000, monto: 500_000 });

    expect(resultado).toEqual({ saldoCapitalNuevo: 4_500_000, contratoFinalizado: false });
  });

  it("abono que agota el saldo exacto: contrato finalizado", () => {
    const resultado = calcularAbonoCapital({ saldoCapitalPendiente: 500_000, monto: 500_000 });

    expect(resultado).toEqual({ saldoCapitalNuevo: 0, contratoFinalizado: true });
  });

  it("monto mayor al saldo pendiente: rechaza la operación", () => {
    expect(() => calcularAbonoCapital({ saldoCapitalPendiente: 500_000, monto: 500_001 })).toThrow(
      MontoExcedeSaldoError,
    );
  });
});
