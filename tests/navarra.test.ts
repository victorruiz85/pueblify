import { describe, expect, it } from "vitest";
import { NAVARRA_MUNICIPIOS } from "@/lib/data/navarra";
import { MemoryRepo } from "@/lib/data/memory";

describe("Catálogo oficial de Navarra", () => {
  it("tiene los 272 municipios y todos con INE/CP de 5 dígitos", () => {
    expect(NAVARRA_MUNICIPIOS.length).toBe(272);
    for (const m of NAVARRA_MUNICIPIOS) {
      expect(m.ineCode).toMatch(/^\d{5}$/);
      expect(m.cp).toMatch(/^\d{5}$/);
      expect(m.provincia).toBe("Navarra");
    }
  });

  it("incluye municipios de control con su INE correcto", () => {
    const byName = (n: string) => NAVARRA_MUNICIPIOS.find((m) => m.nombre.startsWith(n));
    expect(byName("Pamplona")?.ineCode).toBe("31201");
    expect(byName("Sangüesa")?.ineCode).toBe("31216");
    expect(byName("Lumbier")?.ineCode).toBe("31159");
    expect(byName("Tudela")?.ineCode).toBe("31232");
  });
});

describe("asegurarMunicipioPorIne (memoria)", () => {
  it("reutiliza el municipio sembrado si ya existe ese INE (no duplica)", async () => {
    const repo = new MemoryRepo();
    const antes = (await repo.getMunicipios()).length;
    const sang = await repo.asegurarMunicipioPorIne("31216"); // Sangüesa, ya sembrado
    expect(sang.slug).toBe("sanguesa");
    expect((await repo.getMunicipios()).length).toBe(antes);
  });

  it("activa un municipio nuevo desde el catálogo y hereda el CP", async () => {
    const repo = new MemoryRepo();
    const antes = (await repo.getMunicipios()).length;
    const tudela = await repo.asegurarMunicipioPorIne("31232");
    expect(tudela.nombre).toBe("Tudela");
    expect(tudela.cp).toBe("31500");
    expect(tudela.ineCode).toBe("31232");
    expect((await repo.getMunicipios()).length).toBe(antes + 1);
  });
});
