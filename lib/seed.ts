// Datos sembrados del PILOTO: comarca con una empresa tractora.
// Permite que el MVP arranque y se vea funcionando sin Supabase.

import type {
  Caso,
  CategoriaSenal,
  Empresa,
  EstadoSenal,
  Hogar,
  Municipio,
  Senales,
  Tecnico,
  Vivienda,
} from "./types";

const DIA = 1000 * 60 * 60 * 24;
const hace = (dias: number) => new Date(Date.now() - dias * DIA).toISOString();
const dentroDe = (dias: number) => new Date(Date.now() + dias * DIA).toISOString();

function senales(overrides: Partial<Record<CategoriaSenal, EstadoSenal>>): Senales {
  return {
    empleo_pareja: "no_aplica",
    escolarizacion: "no_aplica",
    transporte: "no_aplica",
    teletrabajo: "no_aplica",
    dependencia: "no_aplica",
    conciliacion: "no_aplica",
    integracion_social: "necesario",
    ...overrides,
  };
}

export const tecnicos: Tecnico[] = [
  { id: "t1", nombre: "Marta Iribarren", organizacion: "GAL Zona Media de Navarra" },
];

export const municipios: Municipio[] = [
  {
    id: "m1",
    slug: "sanguesa",
    nombre: "Sangüesa",
    provincia: "Navarra",
    poblacionBase: 5040,
    objetivoNuevos: 60,
    matriculaEscolar: 182,
    umbralEscolar: 150,
    riesgoDespoblacion: "medio",
    cp: "31400",
  },
  {
    id: "m2",
    slug: "lumbier",
    nombre: "Lumbier",
    provincia: "Navarra",
    poblacionBase: 1410,
    objetivoNuevos: 30,
    matriculaEscolar: 96,
    umbralEscolar: 105,
    riesgoDespoblacion: "alto",
    cp: "31440",
  },
  {
    id: "m3",
    slug: "aibar",
    nombre: "Aibar",
    provincia: "Navarra",
    poblacionBase: 790,
    objetivoNuevos: 18,
    matriculaEscolar: 41,
    umbralEscolar: 45,
    riesgoDespoblacion: "critico",
    cp: "31479",
  },
];

export const empresas: Empresa[] = [
  { id: "e1", nombre: "Conservas del Pirineo", municipioId: "m1", sector: "Agroalimentario", vacantes: 18, esTractora: true },
  { id: "e2", nombre: "Aserradero de Lumbier", municipioId: "m2", sector: "Madera", vacantes: 6, esTractora: false },
  { id: "e3", nombre: "Residencia Santa Eufemia", municipioId: "m3", sector: "Sociosanitario", vacantes: 4, esTractora: false },
];

export const viviendas: Vivienda[] = [
  { id: "v1", municipioId: "m1", titulo: "Piso reformado centro", tipo: "piso", plazas: 4, precio: 480, estado: "publicada", admiteMascotas: true },
  { id: "v2", municipioId: "m1", titulo: "Casa con patio", tipo: "casa", plazas: 5, precio: 600, estado: "publicada", admiteMascotas: true },
  { id: "v3", municipioId: "m1", titulo: "Estudio plaza Mayor", tipo: "estudio", plazas: 2, precio: 350, estado: "reservada", admiteMascotas: false },
  { id: "v4", municipioId: "m2", titulo: "Casa de pueblo rehabilitada", tipo: "casa", plazas: 5, precio: 520, estado: "publicada", admiteMascotas: true },
  { id: "v5", municipioId: "m2", titulo: "Piso junto a la foz", tipo: "piso", plazas: 3, precio: 410, estado: "publicada", admiteMascotas: false },
  { id: "v6", municipioId: "m3", titulo: "Casa con huerto", tipo: "casa", plazas: 4, precio: 380, estado: "publicada", admiteMascotas: true },
  { id: "v7", municipioId: "m3", titulo: "Apartamento reformado", tipo: "piso", plazas: 2, precio: 300, estado: "alquilada", admiteMascotas: false },
];

// Helper para construir un hogar
function hogar(
  id: string,
  contacto: string,
  tamano: number,
  origen: Hogar["origen"],
  miembros: Hogar["miembros"],
  vinculosPrevios: boolean,
  s: Partial<Record<CategoriaSenal, EstadoSenal>>,
  diasAlta: number,
  region?: string,
): Hogar {
  return {
    id,
    contacto,
    email: `${contacto.split(" ")[0].toLowerCase()}@example.com`,
    telefono: "6XX XXX XXX",
    tamano,
    origen,
    origenRegion: region,
    vinculosPrevios,
    miembros,
    senales: senales(s),
    creadoAt: hace(diasAlta),
  };
}

const ad = (situacion: Hogar["miembros"][number]["situacion"], edad: number) =>
  ({ id: Math.random().toString(36).slice(2, 8), tipo: "adulto" as const, edad, situacion });
const menor = (edad: number, etapa: string) =>
  ({ id: Math.random().toString(36).slice(2, 8), tipo: "menor" as const, edad, situacion: "estudia" as const, etapaEscolar: etapa });

export const hogares: Hogar[] = [
  // --- Interesados ---
  hogar("h1", "Familia Gómez Soler", 4, "exodo_urbano", [ad("trabaja", 38), ad("busca_empleo", 36), menor(7, "primaria"), menor(4, "infantil")], false, { empleo_pareja: "necesario", escolarizacion: "necesario", integracion_social: "necesario" }, 8, "Madrid"),
  hogar("h2", "Andrei Popescu", 1, "internacional", [ad("busca_empleo", 29)], false, { integracion_social: "necesario", transporte: "necesario" }, 5, "Rumanía"),
  hogar("h3", "Lucía Ferrer", 2, "retorno", [ad("trabaja", 34), ad("busca_empleo", 35)], true, { empleo_pareja: "necesario", teletrabajo: "resuelto", integracion_social: "en_proceso" }, 12, "Barcelona"),
  hogar("h4", "Familia Ndiaye", 5, "internacional", [ad("trabaja", 41), ad("cuidados", 39), menor(12, "eso"), menor(9, "primaria"), menor(5, "infantil")], false, { empleo_pareja: "necesario", escolarizacion: "necesario", conciliacion: "necesario", integracion_social: "necesario" }, 3, "Senegal"),

  // --- En acompañamiento ---
  hogar("h5", "Pareja García-Ruiz", 2, "exodo_urbano", [ad("trabaja", 33), ad("busca_empleo", 31)], false, { empleo_pareja: "en_proceso", integracion_social: "en_proceso" }, 40, "Zaragoza"),
  hogar("h6", "Familia Martín Oliva", 4, "exodo_urbano", [ad("trabaja", 40), ad("trabaja", 38), menor(10, "primaria"), menor(6, "primaria")], false, { empleo_pareja: "resuelto", teletrabajo: "resuelto", escolarizacion: "en_proceso", integracion_social: "en_proceso" }, 55, "Bilbao"),
  hogar("h7", "Ibrahima Diallo", 1, "internacional", [ad("trabaja", 27)], false, { integracion_social: "en_proceso", transporte: "resuelto" }, 35, "Guinea"),
  hogar("h8", "Familia Sánchez Vera", 3, "retorno", [ad("trabaja", 36), ad("busca_empleo", 34), menor(3, "infantil")], true, { empleo_pareja: "en_proceso", escolarizacion: "necesario", conciliacion: "necesario", integracion_social: "resuelto" }, 48, "Pamplona"),
  hogar("h9", "Olga Kovalenko", 3, "internacional", [ad("trabaja", 35), menor(14, "eso"), menor(11, "primaria")], false, { escolarizacion: "en_proceso", integracion_social: "en_proceso", dependencia: "no_aplica" }, 30, "Ucrania"),

  // --- Instalados ---
  hogar("h10", "Familia López Arce", 4, "exodo_urbano", [ad("trabaja", 39), ad("trabaja", 37), menor(8, "primaria"), menor(5, "infantil")], false, { empleo_pareja: "resuelto", escolarizacion: "resuelto", integracion_social: "en_proceso" }, 120, "Valencia"),
  hogar("h11", "Pareja Belmonte", 2, "retorno", [ad("trabaja", 45), ad("trabaja", 43)], true, { empleo_pareja: "resuelto", teletrabajo: "resuelto", integracion_social: "resuelto" }, 95, "Madrid"),
  hogar("h12", "Familia Romero Gil", 5, "exodo_urbano", [ad("trabaja", 42), ad("cuidados", 40), menor(13, "eso"), menor(10, "primaria"), menor(7, "primaria")], false, { empleo_pareja: "en_proceso", escolarizacion: "resuelto", conciliacion: "resuelto", integracion_social: "en_proceso" }, 80, "Sevilla"),
  hogar("h13", "Mohammed El Amrani", 4, "internacional", [ad("trabaja", 38), ad("busca_empleo", 35), menor(9, "primaria"), menor(6, "primaria")], false, { empleo_pareja: "en_proceso", escolarizacion: "resuelto", integracion_social: "en_proceso" }, 110, "Marruecos"),

  // --- Asentados ---
  hogar("h14", "Familia Pérez Lanz", 4, "retorno", [ad("trabaja", 44), ad("trabaja", 42), menor(11, "primaria"), menor(8, "primaria")], true, { empleo_pareja: "resuelto", escolarizacion: "resuelto", integracion_social: "resuelto", transporte: "resuelto" }, 520, "Logroño"),
  hogar("h15", "Pareja Etxeberria", 2, "exodo_urbano", [ad("trabaja", 36), ad("trabaja", 34)], false, { empleo_pareja: "resuelto", teletrabajo: "resuelto", integracion_social: "resuelto" }, 480, "San Sebastián"),

  // --- Baja ---
  hogar("h16", "Familia Costa", 3, "internacional", [ad("trabaja", 33), ad("busca_empleo", 31), menor(4, "infantil")], false, { empleo_pareja: "necesario", escolarizacion: "necesario", integracion_social: "necesario" }, 300, "Portugal"),
];

// Helper de casos
function caso(
  id: string,
  hogarId: string,
  municipioId: string,
  estado: Caso["estado"],
  canal: Caso["canal"],
  hitos: Partial<Caso["hitos"]>,
  extra: Partial<Caso> = {},
): Caso {
  return {
    id,
    hogarId,
    municipioDestinoId: municipioId,
    viviendaId: extra.viviendaId ?? null,
    empresaId: extra.empresaId ?? null,
    tecnicoId: "t1",
    estado,
    canal,
    hitos: {
      viviendaAsignada: null,
      empleoResuelto: null,
      empleoPareja: null,
      menoresMatriculados: null,
      mudanza: null,
      empadronado: null,
      ...hitos,
    },
    proximoHito: extra.proximoHito,
    proximoHitoFecha: extra.proximoHitoFecha,
    nota: extra.nota,
    padron: extra.padron,
    retencion: extra.retencion ?? [],
    tareas: extra.tareas ?? [],
    motivoBaja: extra.motivoBaja,
    creadoAt: hace(extra.creadoAt ? Number(extra.creadoAt) : 30),
    actualizadoAt: hace(2),
  };
}

const tarea = (
  id: string,
  texto: string,
  tipo: Caso["tareas"][number]["tipo"],
  prioridad: Caso["tareas"][number]["prioridad"],
  diasFecha?: number,
): Caso["tareas"][number] => ({
  id,
  texto,
  tipo,
  prioridad,
  estado: "pendiente",
  fecha: diasFecha === undefined ? undefined : dentroDe(diasFecha),
});

export const casos: Caso[] = [
  // Interesados
  caso("c1", "h1", "m1", "interesado", "empresa", {}, { empresaId: "e1", proximoHito: "Llamada de bienvenida", proximoHitoFecha: dentroDe(2), tareas: [tarea("k1", "Llamar a la familia para concretar la visita", "llamada", "alta", 1)] }),
  caso("c2", "h2", "m1", "interesado", "web", {}, { empresaId: "e1", proximoHito: "Verificar interés", proximoHitoFecha: dentroDe(4), tareas: [tarea("k2", "Llamar para verificar el interés", "llamada", "media", 3)] }),
  caso("c3", "h3", "m2", "interesado", "gal", {}, { proximoHito: "Enviar fichas de vivienda", proximoHitoFecha: dentroDe(1), tareas: [tarea("k3", "Enviar fichas de vivienda por email", "documentacion", "media")] }),
  caso("c4", "h4", "m1", "interesado", "empresa", {}, { empresaId: "e1", proximoHito: "Cita presencial", proximoHitoFecha: dentroDe(6), tareas: [tarea("k4", "Confirmar visita a la oficina del GAL", "visita", "media", 5)] }),

  // En acompañamiento
  caso("c5", "h5", "m1", "acompanamiento", "empresa", { empleoResuelto: hace(10) }, { empresaId: "e1", viviendaId: "v1", proximoHito: "Resolver empleo pareja", proximoHitoFecha: dentroDe(7), tareas: [tarea("k5", "Llamar al empleador para la pareja", "llamada", "alta", 2)] }),
  caso("c6", "h6", "m2", "acompanamiento", "gal", { viviendaAsignada: hace(15), empleoResuelto: hace(20), empleoPareja: hace(12) }, { viviendaId: "v4", empresaId: "e2", proximoHito: "Matricular menores", proximoHitoFecha: dentroDe(3), tareas: [tarea("k6", "Contactar al colegio para la matrícula", "escuela", "alta", 3)] }),
  caso("c7", "h7", "m2", "acompanamiento", "empresa", { empleoResuelto: hace(8) }, { empresaId: "e2", proximoHito: "Buscar vivienda", proximoHitoFecha: dentroDe(5) }),
  caso("c8", "h8", "m1", "acompanamiento", "ayuntamiento", { viviendaAsignada: hace(6) }, { viviendaId: "v3", proximoHito: "Plaza de guardería", proximoHitoFecha: dentroDe(4), tareas: [tarea("k7", "Confirmar visita a la guardería", "visita", "alta", 1)] }),
  caso("c9", "h9", "m3", "acompanamiento", "gal", { empleoResuelto: hace(14), viviendaAsignada: hace(10) }, { viviendaId: "v6", empresaId: "e3", proximoHito: "Matricular menores", proximoHitoFecha: dentroDe(2) }),

  // Instalados (empadronados recientemente)
  caso("c10", "h10", "m1", "instalado", "empresa", { viviendaAsignada: hace(100), empleoResuelto: hace(110), empleoPareja: hace(70), menoresMatriculados: hace(60), mudanza: hace(58), empadronado: hace(55) }, { empresaId: "e1", viviendaId: "v2", padron: { personas: 4, menores: 2, fecha: hace(55), fuente: "Volante de empadronamiento" } }),
  caso("c11", "h11", "m2", "instalado", "gal", { viviendaAsignada: hace(85), empleoResuelto: hace(90), empleoPareja: hace(88), mudanza: hace(70), empadronado: hace(68) }, { viviendaId: "v5", padron: { personas: 2, menores: 0, fecha: hace(68) } }),
  caso("c12", "h12", "m1", "instalado", "empresa", { viviendaAsignada: hace(70), empleoResuelto: hace(75), menoresMatriculados: hace(50), mudanza: hace(48), empadronado: hace(45) }, { empresaId: "e1", viviendaId: "v1", padron: { personas: 5, menores: 3, fecha: hace(45) }, proximoHito: "Checkpoint 3 meses", proximoHitoFecha: dentroDe(10) }),
  caso("c13", "h13", "m3", "instalado", "empresa", { viviendaAsignada: hace(95), empleoResuelto: hace(100), menoresMatriculados: hace(80), mudanza: hace(78), empadronado: hace(75) }, { empresaId: "e3", viviendaId: "v7", padron: { personas: 4, menores: 2, fecha: hace(75) } }),

  // Asentados (>12 meses, retenidos)
  caso("c14", "h14", "m1", "asentado", "gal", { viviendaAsignada: hace(500), empleoResuelto: hace(510), empleoPareja: hace(505), menoresMatriculados: hace(495), mudanza: hace(492), empadronado: hace(488) }, { empresaId: "e1", viviendaId: "v2", padron: { personas: 4, menores: 2, fecha: hace(488) }, retencion: [{ ventana: "m12", vence: hace(120), completado: hace(118), sigueResidiendo: true, satisfaccion: 9 }] }),
  caso("c15", "h15", "m2", "asentado", "web", { viviendaAsignada: hace(460), empleoResuelto: hace(470), empleoPareja: hace(465), mudanza: hace(455), empadronado: hace(452) }, { viviendaId: "v4", padron: { personas: 2, menores: 0, fecha: hace(452) }, retencion: [{ ventana: "m12", vence: hace(90), completado: hace(88), sigueResidiendo: true, satisfaccion: 8 }] }),

  // Baja
  caso("c16", "h16", "m3", "baja", "empresa", { viviendaAsignada: hace(280), empleoResuelto: hace(285), mudanza: hace(270), empadronado: hace(268) }, { empresaId: "e3", padron: { personas: 3, menores: 1, fecha: hace(268) }, motivoBaja: "servicios", nota: "Se marcharon: falta de plaza de guardería y aislamiento social." }),
];
