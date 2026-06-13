import { describe, expect, it } from "vitest";
import { calcularArraigo, calcularPueblify } from "../lib/indices";
import type { Municipio } from "../lib/types";
import { caso, hace, hogar, senales } from "./fixtures";

describe("calcularArraigo", () => {
  it("hogar con todo resuelto → 100 y banda arraigado", () => {
    const h = hogar({
      vinculosPrevios: true,
      miembros: [
        { id: "a1", tipo: "adulto", situacion: "trabaja" },
        { id: "a2", tipo: "adulto", situacion: "trabaja" },
        { id: "m1", tipo: "menor", situacion: "estudia", etapaEscolar: "primaria" },
      ],
      senales: senales("resuelto"),
    });
    const c = caso({
      hitos: {
        viviendaAsignada: hace(420),
        empleoResuelto: hace(420),
        empleoPareja: hace(420),
        menoresMatriculados: hace(420),
        mudanza: hace(420),
        empadronado: hace(420),
      },
    });
    const r = calcularArraigo(h, c);
    expect(r.score).toBe(100);
    expect(r.banda).toBe("arraigado");
  });

  it("hogar sin nada resuelto → 0 y banda riesgo", () => {
    const h = hogar({
      miembros: [{ id: "a1", tipo: "adulto", situacion: "busca_empleo" }],
      senales: senales("necesario"),
    });
    const r = calcularArraigo(h, caso());
    expect(r.score).toBe(0);
    expect(r.banda).toBe("riesgo");
  });

  it("renormaliza cuando no hay pareja ni menores", () => {
    const h = hogar({ miembros: [{ id: "a1", tipo: "adulto", situacion: "trabaja" }] });
    const r = calcularArraigo(h, caso());
    // empleo_pareja y escolarizacion NO aplican (no figuran en el desglose aplicable)
    const aplicables = r.factores.filter((f) => f.aplica).map((f) => f.clave);
    expect(aplicables).not.toContain("empleo_pareja");
    expect(aplicables).not.toContain("escolarizacion");
  });
});

const MUNI: Municipio = {
  id: "m",
  slug: "m",
  nombre: "Pueblo",
  provincia: "X",
  poblacionBase: 1000,
  objetivoNuevos: 10,
  matriculaEscolar: 50,
  umbralEscolar: 60,
  riesgoDespoblacion: "alto",
};

describe("calcularPueblify · retención aplicable", () => {
  it("con elegibles (≥12m) la retención SÍ aplica", () => {
    const c = caso({
      municipioDestinoId: "m",
      estado: "asentado",
      hitos: { ...caso().hitos, empadronado: hace(400) },
      padron: { personas: 2, menores: 1, fecha: hace(400) },
    });
    const r = calcularPueblify(MUNI, { casos: [c], hogares: [], viviendas: [], empresas: [] });
    const ret = r.componentes.find((x) => x.clave === "retencion")!;
    expect(ret.aplica).toBe(true);
    expect(r.habitantesFijados).toBe(2);
  });

  it("sin elegibles la retención NO aplica (se excluye del índice)", () => {
    const c = caso({
      municipioDestinoId: "m",
      estado: "instalado",
      hitos: { ...caso().hitos, empadronado: hace(30) },
      padron: { personas: 2, menores: 0, fecha: hace(30) },
    });
    const r = calcularPueblify(MUNI, { casos: [c], hogares: [], viviendas: [], empresas: [] });
    const ret = r.componentes.find((x) => x.clave === "retencion")!;
    expect(ret.aplica).toBe(false);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });
});
