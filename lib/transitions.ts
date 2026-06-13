// Reglas de transición de estado de un caso.
// "instalado" y "asentado" son ESTADOS DERIVADOS del empadronamiento y del tiempo,
// no se pueden fijar manualmente. El técnico solo mueve entre interesado/acompañamiento.

import { mesesDesde } from "./format";
import type { Caso, EstadoCaso, Hitos, Padron } from "./types";

// Estados que el técnico puede fijar a mano (botones del tablero).
// El resto (emparejado, instalado, asentado) se DERIVAN automáticamente.
export const ESTADOS_MANUALES: EstadoCaso[] = ["interesado", "acompanamiento"];

export function puedeMoverManual(hacia: EstadoCaso): boolean {
  return ESTADOS_MANUALES.includes(hacia);
}

// Deriva el estado real a partir de los hitos/padrón. Garantiza que:
//  - "asentado" solo se alcanza con empadronamiento de hace ≥12 meses,
//  - "instalado" requiere empadronamiento,
//  - "emparejado" = vivienda asignada + empleo resuelto, sin empadronar aún,
//  - nunca se pueda marcar emparejado/instalado/asentado a mano.
export function derivarEstado(c: {
  estado: EstadoCaso;
  hitos: Pick<Hitos, "empadronado" | "viviendaAsignada" | "empleoResuelto">;
  padron?: Padron;
}): EstadoCaso {
  if (c.estado === "baja") return "baja";
  const empadronado = c.hitos.empadronado ?? c.padron?.fecha ?? null;
  if (empadronado) {
    return mesesDesde(empadronado) >= 12 ? "asentado" : "instalado";
  }
  // Vivienda + empleo resueltos pero sin empadronamiento: emparejado.
  if (c.hitos.viviendaAsignada && c.hitos.empleoResuelto) return "emparejado";
  // Sin empadronamiento no puede figurar como instalado/asentado/emparejado.
  if (c.estado === "instalado" || c.estado === "asentado" || c.estado === "emparejado") {
    return "acompanamiento";
  }
  return c.estado;
}

// Aplica la derivación devolviendo una copia con el estado coherente.
export function conEstadoDerivado(c: Caso): Caso {
  return { ...c, estado: derivarEstado(c) };
}
