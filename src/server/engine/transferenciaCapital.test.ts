import { describe, expect, it } from "vitest";
import { calcularTransferenciaCapital, MontoExcedeSaldoPrestamoError } from "./transferenciaCapital";

describe("calcularTransferenciaCapital", () => {
  it("transferencia parcial: reduce el saldo del préstamo sin saldarlo", () => {
    const resultado = calcularTransferenciaCapital({ saldoPrestamoPendiente: 500_000, monto: 200_000 });

    expect(resultado).toEqual({ saldoPrestamoNuevo: 300_000, prestamoPagado: false });
  });

  it("transferencia del saldo completo: el préstamo queda pagado", () => {
    const resultado = calcularTransferenciaCapital({ saldoPrestamoPendiente: 500_000, monto: 500_000 });

    expect(resultado).toEqual({ saldoPrestamoNuevo: 0, prestamoPagado: true });
  });

  it("monto mayor al saldo del préstamo: rechaza la operación", () => {
    expect(() =>
      calcularTransferenciaCapital({ saldoPrestamoPendiente: 500_000, monto: 500_001 }),
    ).toThrow(MontoExcedeSaldoPrestamoError);
  });
});
