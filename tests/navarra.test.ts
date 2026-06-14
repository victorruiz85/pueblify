// (Antes Navarra) Catálogo oficial de Soria + activación de municipios.
import { describe, expect, it } from "vitest";
import { SORIA_MUNICIPIOS, SORIA_CENTROS } from "@/lib/data/soria";
import { MemoryRepo } from "@/lib/data/memory";

describe("Catálogo oficial de Soria", () => {
  it("tiene los 183 municipios, INE/CP de 5 dígitos y población > 0", () => {
    expect(SORIA_MUNICIPIOS.length).toBe(183);
    for (const m of SORIA_MUNICIPIOS) {
      expect(m.ineCode).toMatch(/^42\d{3}$/);
      expect(m.cp).toMatch(/^42\d{3}$/);
      expect(m.provincia).toBe("Soria");
      expect(Number.isInteger(m.poblacion)).toBe(true);
      expect(m.poblacion).toBeGreaterThan(0);
    }
  });

  it("trae población oficial (control: Soria capital, Ólvega, Ágreda)", () => {
    const byIne = (c: string) => SORIA_MUNICIPIOS.find((m) => m.ineCode === c);
    expect(byIne("42173")?.poblacion).toBe(41025); // Soria
    expect(byIne("42134")?.poblacion).toBe(3782); // Ólvega
    expect(byIne("42004")?.poblacion).toBe(3133); // Ágreda
  });

  it("incluye centros educativos (JCyL) ligados a su municipio", () => {
    expect(SORIA_CENTROS.length).toBeGreaterThan(70);
    for (const c of SORIA_CENTROS) expect(c.ineCode).toMatch(/^42\d{3}$/);
    // Ólvega tiene varios centros (CEIP, IES, infantil, adultos)
    const olvega = SORIA_MUNICIPIOS.find((m) => m.ineCode === "42134");
    expect((olvega?.colegios ?? 0)).toBeGreaterThanOrEqual(3);
    expect(olvega?.etapasColegio).toContain("ESO/Bach");
  });
});

describe("asegurarMunicipioPorIne (memoria)", () => {
  it("reutiliza el municipio sembrado si ya existe ese INE (no duplica)", async () => {
    const repo = new MemoryRepo();
    const antes = (await repo.getMunicipios()).length;
    const olvega = await repo.asegurarMunicipioPorIne("42134"); // Ólvega, ya sembrado
    expect(olvega.slug).toBe("olvega");
    expect((await repo.getMunicipios()).length).toBe(antes);
  });

  it("activa un municipio nuevo desde el catálogo y hereda CP y población", async () => {
    const repo = new MemoryRepo();
    const antes = (await repo.getMunicipios()).length;
    const soria = await repo.asegurarMunicipioPorIne("42173"); // Soria capital
    expect(soria.nombre).toBe("Soria");
    expect(soria.cp).toBe("42001");
    expect(soria.poblacionBase).toBe(41025);
    expect((await repo.getMunicipios()).length).toBe(antes + 1);
  });
});
