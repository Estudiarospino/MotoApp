import { describe, expect, it } from "vitest";
import { formatCOP, maxPesos, minPesos, pesos, restarPesos, sumarPesos } from "./money";

describe("pesos", () => {
  it("acepta enteros", () => {
    expect(pesos(350000)).toBe(350000);
    expect(pesos(0)).toBe(0);
  });

  it("rechaza no enteros", () => {
    expect(() => pesos(350000.5)).toThrow();
  });
});

describe("sumarPesos", () => {
  it("suma exacta sin residuos de punto flotante", () => {
    expect(sumarPesos(300000, 350000)).toBe(650000);
    expect(sumarPesos(100, 200, 300)).toBe(600);
    expect(sumarPesos()).toBe(0);
  });
});

describe("restarPesos", () => {
  it("resta exacta, incluyendo resultados negativos", () => {
    expect(restarPesos(650000, 350000)).toBe(300000);
    expect(restarPesos(100, 300)).toBe(-200);
  });
});

describe("minPesos / maxPesos", () => {
  it("devuelve el menor/mayor valor", () => {
    expect(minPesos(300000, 500000)).toBe(300000);
    expect(maxPesos(300000, 500000)).toBe(500000);
  });
});

describe("formatCOP", () => {
  it("formatea sin decimales en pesos colombianos", () => {
    const resultado = formatCOP(650000);
    expect(resultado).not.toContain(",00");
    expect(resultado).toMatch(/650/);
  });
});
