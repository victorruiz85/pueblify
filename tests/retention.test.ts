import { describe, expect, it } from "vitest";
import { calcularRetencion } from "../lib/retention";
import { caso, hace } from "./fixtures";

const empadronado = (dias: number, estado: "instalado" | "asentado" | "baja") =>
  caso({
    estado,
    hitos: { ...caso().hitos, empadronado: hace(dias) },
    padron: { personas: 2, menores: 0, fecha: hace(dias) },
  });

describe("calcularRetencion", () => {
  it("sin elegibles devuelve tasa null", () => {
    const r = calcularRetencion([empadronado(60, "instalado")]);
    expect(r.elegibles).toBe(0);
    expect(r.tasa).toBeNull();
  });

  it("cuenta elegibles (≥12m) y excluye los recientes", () => {
    const r = calcularRetencion([
      empadronado(400, "asentado"), // elegible, retenido
      empadronado(400, "baja"), // elegible, se marchó
      empadronado(30, "instalado"), // NO elegible (reciente)
    ]);
    expect(r.elegibles).toBe(2);
    expect(r.retenidos).toBe(1);
    expect(r.tasa).toBe(50);
  });

  it("no cuenta una baja reciente como elegible", () => {
    const r = calcularRetencion([empadronado(200, "baja")]);
    expect(r.elegibles).toBe(0);
    expect(r.tasa).toBeNull();
  });
});
