// Cálculo de retención: ÚNICA fuente de verdad, usada por el dashboard y el Índice Pueblify.
//
// Definición correcta:
//   Elegible  = caso empadronado cuya alta en el padrón fue hace ≥12 meses
//               (haya permanecido o se haya marchado).
//   Retenido  = elegible que sigue residiendo (estado ≠ baja).
//   Tasa      = retenidos / elegibles  (null si todavía no hay elegibles).
//
// El error anterior mezclaba "asentados / (asentados + todas las bajas)", contando
// bajas que nunca llegaron a los 12 meses y omitiendo a los elegibles que aún residen.

import { mesesDesde } from "./format";
import type { Caso } from "./types";

export interface Retencion {
  elegibles: number;
  retenidos: number;
  tasa: number | null; // porcentaje 0..100 o null
}

export function calcularRetencion(casos: Caso[]): Retencion {
  const elegibles = casos.filter((c) => {
    const fecha = c.hitos.empadronado ?? c.padron?.fecha ?? null;
    return Boolean(fecha) && mesesDesde(fecha) >= 12;
  });
  const retenidos = elegibles.filter((c) => c.estado !== "baja");
  return {
    elegibles: elegibles.length,
    retenidos: retenidos.length,
    tasa: elegibles.length > 0 ? Math.round((100 * retenidos.length) / elegibles.length) : null,
  };
}
