import type { Caso, EstadoSenal, Hogar, Senales } from "../lib/types";

const DIA = 86400000;
export const hace = (dias: number) => new Date(Date.now() - dias * DIA).toISOString();

export function senales(estado: EstadoSenal = "no_aplica"): Senales {
  return {
    empleo_pareja: estado,
    escolarizacion: estado,
    transporte: estado,
    teletrabajo: estado,
    dependencia: estado,
    conciliacion: estado,
    integracion_social: estado,
  };
}

export function hogar(over: Partial<Hogar> = {}): Hogar {
  return {
    id: "h",
    contacto: "Hogar de prueba",
    tamano: 1,
    origen: "exodo_urbano",
    vinculosPrevios: false,
    miembros: [],
    senales: senales(),
    creadoAt: hace(1),
    ...over,
  };
}

export function caso(over: Partial<Caso> = {}): Caso {
  return {
    id: "c",
    hogarId: "h",
    municipioDestinoId: null,
    viviendaId: null,
    empresaId: null,
    tecnicoId: null,
    estado: "interesado",
    canal: "gal",
    hitos: {
      viviendaAsignada: null,
      empleoResuelto: null,
      empleoPareja: null,
      menoresMatriculados: null,
      mudanza: null,
      empadronado: null,
    },
    retencion: [],
    creadoAt: hace(1),
    actualizadoAt: hace(1),
    ...over,
  };
}
