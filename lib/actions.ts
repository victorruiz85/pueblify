"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRepo } from "./data";
import { getSession } from "./auth";
import type { CategoriaSenal, EstadoCaso, EstadoSenal, Hitos, TareaPrioridad, TareaTipo } from "./types";
import { empadronamientoSchema, nuevoHogarSchema } from "./validators";

function revalidar(id?: string) {
  revalidatePath("/");
  revalidatePath("/casos");
  if (id) revalidatePath(`/casos/${id}`);
}

export async function crearHogarAction(_prev: unknown, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = nuevoHogarSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, errores: parsed.error.flatten().fieldErrors };
  }
  const v = parsed.data;
  const session = await getSession();
  const senales: Record<CategoriaSenal, EstadoSenal> = {
    empleo_pareja: v.empleo_pareja,
    escolarizacion: v.escolarizacion,
    transporte: v.transporte,
    teletrabajo: v.teletrabajo,
    dependencia: v.dependencia,
    conciliacion: v.conciliacion,
    integracion_social: v.integracion_social,
  };
  const caso = await getRepo().crearHogarYCaso({
    actorProfileId: session?.profileId ?? null,
    contacto: v.contacto,
    email: v.email || undefined,
    telefono: v.telefono,
    tamano: v.numAdultos + v.numMenores,
    origen: v.origen,
    vinculosPrevios: v.vinculosPrevios,
    consentAt: new Date().toISOString(),
    consentVersion: "v1",
    numAdultos: v.numAdultos,
    numMenores: v.numMenores,
    municipioDestinoId: v.municipioDestinoId ? v.municipioDestinoId : null,
    canal: v.canal,
    empresaId: v.empresaId || null,
    senales,
  });
  revalidar();
  redirect(`/casos/${caso.id}`);
}

export async function moverCasoAction(id: string, estado: EstadoCaso) {
  await getRepo().moverCaso(id, estado);
  revalidar(id);
}

export async function alternarHitoAction(id: string, hito: keyof Hitos) {
  await getRepo().alternarHito(id, hito);
  revalidar(id);
}

export async function asignarViviendaAction(id: string, viviendaId: string | null) {
  await getRepo().asignarVivienda(id, viviendaId);
  revalidar(id);
}

export async function actualizarSenalAction(hogarId: string, categoria: CategoriaSenal, estado: EstadoSenal, casoId: string) {
  await getRepo().actualizarSenal(hogarId, categoria, estado);
  revalidar(casoId);
}

export async function empadronarAction(_prev: unknown, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = empadronamientoSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, errores: parsed.error.flatten().fieldErrors };
  }
  const v = parsed.data;
  await getRepo().registrarEmpadronamiento(v.casoId, {
    personas: v.personas,
    menores: v.menores,
    fecha: new Date(v.fecha).toISOString(),
    fuente: v.fuente,
  });
  revalidar(v.casoId);
  return { ok: true as const };
}

export async function darDeBajaAction(id: string, motivo: string) {
  await getRepo().darDeBaja(id, motivo);
  revalidar(id);
}

export async function agregarTareaAction(
  id: string,
  tarea: { texto: string; tipo: TareaTipo; prioridad: TareaPrioridad; fecha?: string },
) {
  if (!tarea.texto.trim()) return;
  await getRepo().agregarTarea(id, {
    texto: tarea.texto.trim(),
    tipo: tarea.tipo,
    prioridad: tarea.prioridad,
    fecha: tarea.fecha || undefined,
  });
  revalidar(id);
}

export async function completarTareaAction(id: string, tareaId: string) {
  await getRepo().completarTarea(id, tareaId);
  revalidar(id);
}

export async function actualizarNotaAction(id: string, nota: string) {
  await getRepo().actualizarNota(id, nota);
  revalidar(id);
}

export async function fijarProximoPasoAction(id: string, texto: string, fecha?: string) {
  await getRepo().fijarProximoPaso(id, texto, fecha);
  revalidar(id);
}
