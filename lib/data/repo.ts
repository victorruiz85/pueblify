// Contrato de la capa de datos (asíncrona, lista para Supabase).
// Tanto la implementación en memoria como el adaptador de Supabase cumplen esta
// interfaz, de modo que la UI y las Server Actions no dependen del backend concreto.

import type {
  Caso,
  CategoriaSenal,
  Empresa,
  EstadoCaso,
  EstadoSenal,
  Hitos,
  Hogar,
  Municipio,
  Padron,
  TareaCaso,
  Vivienda,
} from "@/lib/types";

export type NuevaTarea = Omit<TareaCaso, "id" | "estado">;

export interface NuevoHogarInput {
  contacto: string;
  email?: string;
  telefono?: string;
  tamano: number;
  origen: Hogar["origen"];
  origenRegion?: string;
  vinculosPrevios: boolean;
  numAdultos: number;
  numMenores: number;
  municipioDestinoId: string | null;
  canal: Caso["canal"];
  senales: Record<CategoriaSenal, EstadoSenal>;
  empresaId?: string | null;
  // Profile del usuario autenticado que crea el caso. Se usa para fijar
  // households.lead_profile_id y relocations.agent_id (no se confía en el cliente).
  actorProfileId?: string | null;
  // RGPD: marca temporal y versión del consentimiento informado.
  consentAt?: string | null;
  consentVersion?: string | null;
}

export interface Repo {
  // Lecturas (devuelven el estado del caso ya DERIVADO)
  getCasos(): Promise<Caso[]>;
  getCaso(id: string): Promise<Caso | null>;
  getHogar(id: string): Promise<Hogar | null>;
  getMunicipios(): Promise<Municipio[]>;
  getMunicipio(id: string): Promise<Municipio | null>;
  getViviendas(): Promise<Vivienda[]>;
  getEmpresas(): Promise<Empresa[]>;
  getEmpresa(id: string): Promise<Empresa | null>;

  // Mutaciones
  crearHogarYCaso(input: NuevoHogarInput): Promise<Caso>;
  moverCaso(id: string, estado: EstadoCaso): Promise<void>;
  alternarHito(id: string, hito: keyof Hitos): Promise<void>;
  registrarEmpadronamiento(id: string, padron: Padron): Promise<void>;
  actualizarSenal(hogarId: string, categoria: CategoriaSenal, estado: EstadoSenal): Promise<void>;
  asignarVivienda(id: string, viviendaId: string | null): Promise<void>;
  darDeBaja(id: string, motivo: string): Promise<void>;
  // Tareas, notas y próximo paso (gestión operativa del caso)
  agregarTarea(id: string, tarea: NuevaTarea): Promise<void>;
  completarTarea(id: string, tareaId: string): Promise<void>;
  actualizarNota(id: string, nota: string): Promise<void>;
  fijarProximoPaso(id: string, texto: string, fecha?: string): Promise<void>;
}
