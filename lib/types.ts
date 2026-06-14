// Modelo de datos de Pueblify (v1.2)
// La unidad de valor es el HOGAR ASENTADO, no la vivienda alquilada.
// La vivienda y el empleo son habilitadores dentro de un CASO (relocation).

export type EstadoCaso =
  | "interesado"
  | "acompanamiento"
  | "emparejado"
  | "instalado"
  | "asentado"
  | "baja";

export const ESTADOS_TABLERO: EstadoCaso[] = [
  "interesado",
  "acompanamiento",
  "emparejado",
  "instalado",
  "asentado",
];

export const ETIQUETA_ESTADO: Record<EstadoCaso, string> = {
  interesado: "Interesado",
  acompanamiento: "En acompañamiento",
  emparejado: "Emparejado",
  instalado: "Instalado",
  asentado: "Asentado",
  baja: "Baja",
};

export type OrigenHogar =
  | "retorno"
  | "exodo_urbano"
  | "internacional"
  | "movilidad_local";

export const ETIQUETA_ORIGEN: Record<OrigenHogar, string> = {
  retorno: "Retorno",
  exodo_urbano: "Éxodo urbano",
  internacional: "Internacional",
  movilidad_local: "Movilidad local",
};

export type CanalOrigen =
  | "web"
  | "ayuntamiento"
  | "empresa"
  | "gal"
  | "evento";

export const ETIQUETA_CANAL: Record<CanalOrigen, string> = {
  web: "Web",
  ayuntamiento: "Ayuntamiento",
  empresa: "Empresa tractora",
  gal: "Grupo LEADER / GAL",
  evento: "Evento",
};

export type TipoMiembro = "adulto" | "menor";

export type SituacionMiembro =
  | "trabaja"
  | "busca_empleo"
  | "estudia"
  | "cuidados"
  | "jubilado"
  | "no_aplica";

export interface Miembro {
  id: string;
  tipo: TipoMiembro;
  edad?: number;
  situacion: SituacionMiembro;
  etapaEscolar?: string; // infantil | primaria | eso | otra
}

// Las 7 señales de arraigo (Mejora 2)
export type CategoriaSenal =
  | "empleo_pareja"
  | "escolarizacion"
  | "transporte"
  | "teletrabajo"
  | "dependencia"
  | "conciliacion"
  | "integracion_social";

export type EstadoSenal = "necesario" | "en_proceso" | "resuelto" | "no_aplica";

export const ETIQUETA_SENAL: Record<CategoriaSenal, string> = {
  empleo_pareja: "Empleo de la pareja",
  escolarizacion: "Escolarización",
  transporte: "Transporte",
  teletrabajo: "Teletrabajo",
  // Reformulado por minimización RGPD: evita registrar detalle de salud.
  dependencia: "Necesidad de apoyo",
  conciliacion: "Conciliación",
  integracion_social: "Integración social",
};

export type Senales = Record<CategoriaSenal, EstadoSenal>;

export interface Hogar {
  id: string;
  contacto: string;
  email?: string;
  telefono?: string;
  tamano: number;
  origen: OrigenHogar;
  origenRegion?: string;
  vinculosPrevios: boolean;
  miembros: Miembro[];
  senales: Senales;
  // RGPD: registro del consentimiento informado (accountability).
  consentAt?: string;
  consentVersion?: string;
  creadoAt: string;
}

export type EstadoVivienda =
  | "borrador"
  | "revision"
  | "publicada"
  | "reservada"
  | "alquilada";

export interface Vivienda {
  id: string;
  municipioId: string;
  titulo: string;
  tipo: "piso" | "casa" | "estudio" | "habitacion";
  plazas: number;
  precio: number;
  estado: EstadoVivienda;
  admiteMascotas: boolean;
}

export interface Empresa {
  id: string;
  nombre: string;
  municipioId: string;
  cp?: string; // CP heredado del municipio
  sector: string;
  vacantes: number; // puestos sin cubrir
  esTractora: boolean;
}

export interface Municipio {
  id: string;
  slug: string;
  nombre: string;
  provincia: string;
  poblacionBase: number;
  objetivoNuevos: number;
  matriculaEscolar: number;
  umbralEscolar: number; // mínimo de alumnos para mantener la escuela
  riesgoDespoblacion: "critico" | "alto" | "medio" | "bajo";
  cp?: string; // código postal (del catálogo)
  ineCode?: string; // código INE de 5 dígitos (enlace al catálogo oficial)
}

// Municipio del catálogo OFICIAL (solo lectura). Alimenta la cascada
// provincia → municipio → CP. No es una entidad operativa de Pueblify.
export interface MunicipioOficial {
  ineCode: string;
  nombre: string;
  provincia: string;
  cp: string;
}

// Hitos del caso: cada uno guarda la fecha en la que se marca (o null)
export interface Hitos {
  viviendaAsignada: string | null;
  empleoResuelto: string | null;
  empleoPareja: string | null; // si aplica
  menoresMatriculados: string | null; // si hay menores
  mudanza: string | null;
  empadronado: string | null;
}

export const HITOS_ORDEN: (keyof Hitos)[] = [
  "viviendaAsignada",
  "empleoResuelto",
  "empleoPareja",
  "menoresMatriculados",
  "mudanza",
  "empadronado",
];

export const ETIQUETA_HITO: Record<keyof Hitos, string> = {
  viviendaAsignada: "Vivienda asignada",
  empleoResuelto: "Empleo resuelto",
  empleoPareja: "Empleo de la pareja",
  menoresMatriculados: "Menores matriculados",
  mudanza: "Mudanza realizada",
  empadronado: "Empadronado",
};

export interface Padron {
  personas: number;
  menores: number;
  fecha: string;
  fuente?: string;
}

export type VentanaRetencion = "m3" | "m6" | "m12" | "m24";

export interface CheckpointRetencion {
  ventana: VentanaRetencion;
  vence: string;
  completado?: string;
  sigueResidiendo?: boolean;
  satisfaccion?: number; // 0..10
}

// Tarea operativa dentro de un caso (lista, no entidad/tabla aparte).
export type TareaTipo = "llamada" | "visita" | "documentacion" | "empleo" | "escuela" | "otro";
export type TareaPrioridad = "alta" | "media" | "baja";

export const ETIQUETA_TAREA_TIPO: Record<TareaTipo, string> = {
  llamada: "Llamada",
  visita: "Visita",
  documentacion: "Documentación",
  empleo: "Empleo",
  escuela: "Escuela",
  otro: "Otro",
};

export interface TareaCaso {
  id: string;
  texto: string;
  tipo: TareaTipo;
  fecha?: string;
  prioridad: TareaPrioridad;
  estado: "pendiente" | "completada";
}

export interface Caso {
  id: string;
  hogarId: string;
  municipioDestinoId: string | null;
  viviendaId: string | null;
  empresaId: string | null;
  tecnicoId: string | null;
  estado: EstadoCaso;
  canal: CanalOrigen;
  hitos: Hitos;
  proximoHito?: string;
  proximoHitoFecha?: string;
  nota?: string;
  padron?: Padron;
  retencion: CheckpointRetencion[];
  tareas: TareaCaso[];
  motivoBaja?: string;
  creadoAt: string;
  actualizadoAt: string;
}

export interface Tecnico {
  id: string;
  nombre: string;
  organizacion: string;
}
