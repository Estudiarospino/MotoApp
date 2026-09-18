import { describe, expect, it, vi } from "vitest";
import {
  calcularVencimiento,
  estadoVencimiento,
  motoNecesitaAtencionDocumentos,
  UMBRAL_ALERTA_VENCIMIENTO_DIAS,
} from "./moto-documentos";

describe("calcularVencimiento", () => {
  it("suma meses respetando el año", () => {
    expect(calcularVencimiento(new Date("2026-03-15"), 12)).toEqual(new Date("2027-03-15"));
  });

  it("maneja el desbordamiento de fin de mes (31 ene + 1 mes)", () => {
    // JS normaliza el 31 de febrero corriéndolo a marzo — comportamiento conocido y aceptado.
    expect(calcularVencimiento(new Date("2026-01-31"), 1)).toEqual(new Date("2026-03-03"));
  });
});

describe("estadoVencimiento", () => {
  const AHORA = new Date("2026-06-15T12:00:00Z");

  it("sin fecha de expedición -> Sin registrar", () => {
    expect(estadoVencimiento(null, 12)).toEqual({
      label: "Sin registrar",
      variant: "secondary",
      vencimiento: null,
    });
  });

  it("vencimiento en el pasado -> Vencido", () => {
    vi.useFakeTimers().setSystemTime(AHORA);
    const resultado = estadoVencimiento(new Date("2025-01-01"), 12);
    expect(resultado.variant).toBe("destructive");
    expect(resultado.label).toBe("Vencido");
    vi.useRealTimers();
  });

  it(`vencimiento dentro de ${UMBRAL_ALERTA_VENCIMIENTO_DIAS} días -> Vence en N días`, () => {
    vi.useFakeTimers().setSystemTime(AHORA);
    // AHORA es mediodía UTC; el vencimiento cae a medianoche, así que quedan 9 días completos (no 10).
    const expedicion = new Date("2025-06-25"); // vence 2026-06-25T00:00:00Z
    const resultado = estadoVencimiento(expedicion, 12);
    expect(resultado.variant).toBe("warning");
    expect(resultado.label).toBe("Vence en 9 días");
    vi.useRealTimers();
  });

  it("vencimiento lejano -> Vigente", () => {
    vi.useFakeTimers().setSystemTime(AHORA);
    const resultado = estadoVencimiento(new Date("2026-01-01"), 12);
    expect(resultado.variant).toBe("success");
    expect(resultado.label).toBe("Vigente");
    vi.useRealTimers();
  });
});

describe("motoNecesitaAtencionDocumentos", () => {
  const AHORA = new Date("2026-06-15T12:00:00Z");

  it("false cuando ambos están vigentes o sin registrar", () => {
    vi.useFakeTimers().setSystemTime(AHORA);
    expect(
      motoNecesitaAtencionDocumentos({
        soatFechaExpedicion: new Date("2026-01-01"),
        tecnomecanicaFechaExpedicion: null,
      }),
    ).toBe(false);
    vi.useRealTimers();
  });

  it("true cuando alguno está vencido o por vencer", () => {
    vi.useFakeTimers().setSystemTime(AHORA);
    expect(
      motoNecesitaAtencionDocumentos({
        soatFechaExpedicion: new Date("2025-01-01"),
        tecnomecanicaFechaExpedicion: null,
      }),
    ).toBe(true);
    vi.useRealTimers();
  });
});
