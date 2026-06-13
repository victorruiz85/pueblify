import { describe, expect, it } from "vitest";
import { derivarEstado, puedeMoverManual } from "../lib/transitions";
import { caso, hace } from "./fixtures";

describe("derivarEstado", () => {
  it("conserva la baja", () => {
    expect(derivarEstado(caso({ estado: "baja" }))).toBe("baja");
  });

  it("empadronado hace ≥12 meses → asentado", () => {
    const c = caso({
      estado: "instalado",
      hitos: { ...caso().hitos, empadronado: hace(400) },
      padron: { personas: 2, menores: 0, fecha: hace(400) },
    });
    expect(derivarEstado(c)).toBe("asentado");
  });

  it("empadronado hace <12 meses → instalado", () => {
    const c = caso({
      estado: "instalado",
      hitos: { ...caso().hitos, empadronado: hace(60) },
      padron: { personas: 2, menores: 0, fecha: hace(60) },
    });
    expect(derivarEstado(c)).toBe("instalado");
  });

  it("vivienda + empleo resueltos sin empadronar → emparejado", () => {
    const c = caso({
      estado: "acompanamiento",
      hitos: { ...caso().hitos, viviendaAsignada: hace(5), empleoResuelto: hace(5) },
    });
    expect(derivarEstado(c)).toBe("emparejado");
  });

  it("sin empadronar no puede figurar como asentado (se degrada)", () => {
    expect(derivarEstado(caso({ estado: "asentado" }))).toBe("acompanamiento");
  });

  it("interesado sin datos se mantiene", () => {
    expect(derivarEstado(caso({ estado: "interesado" }))).toBe("interesado");
  });
});

describe("puedeMoverManual", () => {
  it("NO permite fijar asentado a mano", () => {
    expect(puedeMoverManual("asentado")).toBe(false);
  });
  it("NO permite fijar instalado a mano", () => {
    expect(puedeMoverManual("instalado")).toBe(false);
  });
  it("permite interesado y acompañamiento", () => {
    expect(puedeMoverManual("interesado")).toBe(true);
    expect(puedeMoverManual("acompanamiento")).toBe(true);
  });
});
