import { beforeEach, describe, expect, it } from "vitest";
import { MemoryRepo } from "../lib/data/memory";
import type { CategoriaSenal, EstadoSenal } from "../lib/types";

const SENALES: Record<CategoriaSenal, EstadoSenal> = {
  empleo_pareja: "no_aplica",
  escolarizacion: "necesario",
  transporte: "no_aplica",
  teletrabajo: "no_aplica",
  dependencia: "no_aplica",
  conciliacion: "no_aplica",
  integracion_social: "necesario",
};

beforeEach(() => {
  // Reinicia el almacén en memoria entre tests.
  (globalThis as unknown as { __pueblifyDB?: unknown }).__pueblifyDB = undefined;
});

describe("flujo demo: crear → hito → empadronar → baja", () => {
  it("recorre los estados y propaga el actor autenticado", async () => {
    const repo = new MemoryRepo();

    const caso = await repo.crearHogarYCaso({
      contacto: "Familia Demo",
      tamano: 3,
      origen: "exodo_urbano",
      vinculosPrevios: false,
      numAdultos: 2,
      numMenores: 1,
      municipioDestinoId: "m1",
      canal: "gal",
      senales: SENALES,
      actorProfileId: "prof-tecnico",
    });
    expect(caso.estado).toBe("interesado");
    expect(caso.tecnicoId).toBe("prof-tecnico"); // identidad del usuario autenticado

    // Marcar un habilitador → pasa a acompañamiento
    await repo.alternarHito(caso.id, "viviendaAsignada");
    expect((await repo.getCaso(caso.id))!.estado).toBe("acompanamiento");

    // Empadronar → instalado
    await repo.registrarEmpadronamiento(caso.id, {
      personas: 3,
      menores: 1,
      fecha: new Date().toISOString(),
    });
    const instalado = await repo.getCaso(caso.id);
    expect(instalado!.estado).toBe("instalado");
    expect(instalado!.padron?.personas).toBe(3);

    // Baja con motivo
    await repo.darDeBaja(caso.id, "servicios");
    const baja = await repo.getCaso(caso.id);
    expect(baja!.estado).toBe("baja");
    expect(baja!.motivoBaja).toBe("servicios");
  });

  it("permite crear un caso sin municipio destino", async () => {
    const repo = new MemoryRepo();
    const caso = await repo.crearHogarYCaso({
      contacto: "Sin Municipio",
      tamano: 1,
      origen: "internacional",
      vinculosPrevios: false,
      numAdultos: 1,
      numMenores: 0,
      municipioDestinoId: null,
      canal: "web",
      senales: SENALES,
    });
    expect(caso.municipioDestinoId).toBeNull();
    expect(caso.estado).toBe("interesado");
  });

  it("no permite mover un caso a 'asentado' manualmente", async () => {
    const repo = new MemoryRepo();
    const enAcomp = (await repo.getCasos()).find((c) => c.estado === "acompanamiento");
    expect(enAcomp).toBeTruthy();
    await repo.moverCaso(enAcomp!.id, "asentado");
    expect((await repo.getCaso(enAcomp!.id))!.estado).not.toBe("asentado");
  });

  it("vivienda + empleo derivan a 'emparejado'", async () => {
    const repo = new MemoryRepo();
    const c = await repo.crearHogarYCaso({
      contacto: "Empareja",
      tamano: 2,
      origen: "exodo_urbano",
      vinculosPrevios: false,
      numAdultos: 1,
      numMenores: 0,
      municipioDestinoId: "m1",
      canal: "gal",
      senales: SENALES,
    });
    await repo.alternarHito(c.id, "viviendaAsignada");
    await repo.alternarHito(c.id, "empleoResuelto");
    expect((await repo.getCaso(c.id))!.estado).toBe("emparejado");
  });

  it("gestiona tareas, nota y próximo paso", async () => {
    const repo = new MemoryRepo();
    const c = await repo.crearHogarYCaso({
      contacto: "Tareas",
      tamano: 1,
      origen: "retorno",
      vinculosPrevios: true,
      numAdultos: 1,
      numMenores: 0,
      municipioDestinoId: "m1",
      canal: "gal",
      senales: SENALES,
    });
    await repo.agregarTarea(c.id, { texto: "Llamar al propietario", tipo: "llamada", prioridad: "alta" });
    let got = await repo.getCaso(c.id);
    expect(got!.tareas.length).toBe(1);
    const tid = got!.tareas[0].id;
    expect(got!.tareas[0].estado).toBe("pendiente");

    await repo.completarTarea(c.id, tid);
    got = await repo.getCaso(c.id);
    expect(got!.tareas[0].estado).toBe("completada");

    await repo.actualizarNota(c.id, "Hogar muy motivado");
    await repo.fijarProximoPaso(c.id, "Confirmar visita", undefined);
    got = await repo.getCaso(c.id);
    expect(got!.nota).toBe("Hogar muy motivado");
    expect(got!.proximoHito).toBe("Confirmar visita");
  });
});
