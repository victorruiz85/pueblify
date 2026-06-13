// Apoyo a la JORNADA del técnico. Todo se DERIVA de datos ya existentes
// (hitos, padrón, fechas, retención). No introduce entidades ni estado nuevo.

import { ETIQUETA_HITO, HITOS_ORDEN, type Caso, type Hogar } from "./types";

const DIA = 86400000;
const ms = (iso?: string | null) => (iso ? new Date(iso).getTime() : NaN);
const diasDesde = (iso?: string | null) => (iso ? Math.floor((Date.now() - ms(iso)) / DIA) : Infinity);
const dentroDeDias = (iso: string | null | undefined, n: number) =>
  iso ? ms(iso) >= Date.now() && ms(iso) <= Date.now() + n * DIA : false;
const ultimosDias = (iso: string | null | undefined, n: number) =>
  iso ? ms(iso) >= Date.now() - n * DIA && ms(iso) <= Date.now() + DIA : false;

/* -------- Tareas pendientes -------- */
export interface Tarea {
  casoId: string;
  contacto: string;
  etiqueta: string;
  urgencia: "alta" | "media";
  fecha?: string;
}

export function tareasPendientes(casos: Caso[], hogarPorId: Map<string, Hogar>): Tarea[] {
  const tareas: Tarea[] = [];
  for (const c of casos) {
    if (c.estado === "baja") continue;
    const contacto = hogarPorId.get(c.hogarId)?.contacto ?? "Hogar";
    const hayMenores = hogarPorId.get(c.hogarId)?.miembros.some((m) => m.tipo === "menor") ?? false;

    if (c.proximoHitoFecha && ms(c.proximoHitoFecha) < Date.now()) {
      tareas.push({ casoId: c.id, contacto, etiqueta: `Hito vencido: ${c.proximoHito ?? "pendiente"}`, urgencia: "alta", fecha: c.proximoHitoFecha });
    }
    if (hayMenores && !c.hitos.menoresMatriculados && c.estado !== "interesado") {
      tareas.push({ casoId: c.id, contacto, etiqueta: "Matricular a los menores", urgencia: "alta" });
    }
    if ((c.estado === "interesado" || c.estado === "acompanamiento") && diasDesde(c.actualizadoAt) > 21) {
      tareas.push({ casoId: c.id, contacto, etiqueta: "Caso estancado (>21 días sin avance)", urgencia: "media" });
    }
    for (const r of c.retencion) {
      if (!r.completado && ms(r.vence) < Date.now()) {
        tareas.push({ casoId: c.id, contacto, etiqueta: `Checkpoint de retención ${r.ventana} pendiente`, urgencia: "media", fecha: r.vence });
      }
    }
  }
  return tareas.sort((a, b) => (a.urgencia === b.urgencia ? 0 : a.urgencia === "alta" ? -1 : 1));
}

/* -------- Próximos hitos (siguientes 14 días) -------- */
export interface ProximoHito {
  casoId: string;
  contacto: string;
  hito: string;
  fecha: string;
}

export function proximosHitos(casos: Caso[], hogarPorId: Map<string, Hogar>): ProximoHito[] {
  return casos
    .filter((c) => c.estado !== "baja" && c.proximoHito && dentroDeDias(c.proximoHitoFecha, 14))
    .map((c) => ({
      casoId: c.id,
      contacto: hogarPorId.get(c.hogarId)?.contacto ?? "Hogar",
      hito: c.proximoHito!,
      fecha: c.proximoHitoFecha!,
    }))
    .sort((a, b) => ms(a.fecha) - ms(b.fecha));
}

/* -------- Resumen semanal de impacto (últimos 7 días) -------- */
export interface ResumenSemanal {
  nuevos: number;
  empadronamientos: number;
  personasFijadas: number;
  bajas: number;
  hitosCompletados: number;
}

export function resumenSemanal(casos: Caso[]): ResumenSemanal {
  let nuevos = 0;
  let empadronamientos = 0;
  let personasFijadas = 0;
  let bajas = 0;
  let hitosCompletados = 0;

  for (const c of casos) {
    if (ultimosDias(c.creadoAt, 7)) nuevos++;
    if (c.padron && c.estado !== "baja" && ultimosDias(c.padron.fecha, 7)) {
      empadronamientos++;
      personasFijadas += c.padron.personas;
    }
    if (c.estado === "baja" && ultimosDias(c.actualizadoAt, 7)) bajas++;
    for (const h of HITOS_ORDEN) {
      if (ultimosDias(c.hitos[h], 7)) hitosCompletados++;
    }
  }
  return { nuevos, empadronamientos, personasFijadas, bajas, hitosCompletados };
}

/* -------- Cronología (timeline) de un hogar/caso -------- */
export interface EventoTimeline {
  fecha: string;
  titulo: string;
  detalle?: string;
  tipo: "alta" | "hito" | "padron" | "retencion" | "baja";
}

export function timelineDeCaso(caso: Caso): EventoTimeline[] {
  const eventos: EventoTimeline[] = [];
  eventos.push({ fecha: caso.creadoAt, titulo: "Caso abierto", tipo: "alta" });

  for (const h of HITOS_ORDEN) {
    const fecha = caso.hitos[h];
    if (!fecha) continue;
    if (h === "empadronado") {
      eventos.push({
        fecha,
        titulo: "Empadronado",
        detalle: caso.padron ? `${caso.padron.personas} personas (${caso.padron.menores} menores)` : undefined,
        tipo: "padron",
      });
    } else {
      eventos.push({ fecha, titulo: ETIQUETA_HITO[h], tipo: "hito" });
    }
  }

  for (const r of caso.retencion) {
    if (r.completado) {
      eventos.push({
        fecha: r.completado,
        titulo: `Checkpoint ${r.ventana}`,
        detalle: r.sigueResidiendo ? "Sigue residiendo" : "Se marchó",
        tipo: "retencion",
      });
    }
  }

  if (caso.estado === "baja") {
    eventos.push({ fecha: caso.actualizadoAt, titulo: "Baja", detalle: caso.motivoBaja, tipo: "baja" });
  }

  return eventos.sort((a, b) => ms(a.fecha) - ms(b.fecha));
}

/* -------- Pasos del caso (timeline con estado pendiente/completado/vencido) -------- */
export type EstadoPaso = "pendiente" | "completado" | "vencido";
export interface PasoCaso {
  titulo: string;
  estado: EstadoPaso;
  fecha?: string;
  detalle?: string;
}

function addMeses(iso: string, n: number): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + n);
  return d.toISOString();
}

export function pasosDelCaso(caso: Caso, hogar: Hogar | null): PasoCaso[] {
  const pasos: PasoCaso[] = [];
  const hayPareja = (hogar?.miembros.filter((m) => m.tipo === "adulto").length ?? 0) >= 2;
  const hayMenores = hogar?.miembros.some((m) => m.tipo === "menor") ?? false;
  const empadronado = caso.hitos.empadronado ?? caso.padron?.fecha ?? null;
  const avanzado = caso.estado === "instalado" || caso.estado === "asentado";

  pasos.push({ titulo: "Interés registrado", estado: "completado", fecha: caso.creadoAt });
  pasos.push({ titulo: "Primer contacto", estado: caso.estado === "interesado" ? "pendiente" : "completado" });

  const hito = (titulo: string, fecha: string | null, vencido = false): PasoCaso => ({
    titulo,
    estado: fecha ? "completado" : vencido ? "vencido" : "pendiente",
    fecha: fecha ?? undefined,
  });

  pasos.push(hito("Vivienda asignada", caso.hitos.viviendaAsignada));
  pasos.push(hito("Empleo resuelto", caso.hitos.empleoResuelto));
  if (hayPareja) pasos.push(hito("Empleo de la pareja resuelto", caso.hitos.empleoPareja));
  if (hayMenores) pasos.push(hito("Menores matriculados", caso.hitos.menoresMatriculados, avanzado));
  pasos.push(hito("Mudanza confirmada", caso.hitos.mudanza));
  pasos.push({
    titulo: "Empadronamiento confirmado",
    estado: empadronado ? "completado" : "pendiente",
    fecha: empadronado ?? undefined,
    detalle: caso.padron ? `${caso.padron.personas} personas (${caso.padron.menores} menores)` : undefined,
  });

  if (empadronado) {
    for (const [ventana, meses] of [["m3", 3], ["m6", 6], ["m12", 12]] as const) {
      const due = addMeses(empadronado, meses);
      const ck = caso.retencion.find((r) => r.ventana === ventana);
      let estado: EstadoPaso = "pendiente";
      if (ck?.completado) estado = "completado";
      else if (ms(due) < Date.now()) estado = "vencido";
      pasos.push({
        titulo: `Checkpoint ${meses} meses`,
        estado,
        fecha: ck?.completado ?? due,
        detalle: ck?.completado ? (ck.sigueResidiendo ? "Sigue residiendo" : "Se marchó") : undefined,
      });
    }
  }

  if (caso.estado === "baja") {
    pasos.push({ titulo: "Baja", estado: "completado", fecha: caso.actualizadoAt, detalle: caso.motivoBaja });
  }

  return pasos;
}
