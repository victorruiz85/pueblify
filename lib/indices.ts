// Índices propietarios de Pueblify (v1.2).
// Implementación por REGLAS SIMPLES (sin IA), explicable y auditable.

import { mesesDesde } from "./format";
import { calcularRetencion } from "./retention";
import type { Caso, Empresa, Hogar, Municipio, Vivienda } from "./types";

/* ============================================================
 *  ÍNDICE DE ARRAIGO  (Mejora 3)
 *  Estima la probabilidad de permanencia de un hogar (0-100)
 *  a partir de factores observables. Es un indicador ADELANTADO.
 * ============================================================ */

export interface FactorArraigo {
  clave: string;
  etiqueta: string;
  peso: number;
  sub: number; // 0..1
  aplica: boolean;
}

export type BandaArraigo = "arraigado" | "fragil" | "riesgo";

export interface ResultadoArraigo {
  score: number;
  banda: BandaArraigo;
  factores: FactorArraigo[];
}

export function bandaArraigo(score: number): BandaArraigo {
  if (score >= 70) return "arraigado";
  if (score >= 40) return "fragil";
  return "riesgo";
}

export const ETIQUETA_BANDA: Record<BandaArraigo, string> = {
  arraigado: "Arraigado",
  fragil: "Frágil",
  riesgo: "En riesgo",
};

export function calcularArraigo(hogar: Hogar, caso: Caso): ResultadoArraigo {
  const hayMenores = hogar.miembros.some((m) => m.tipo === "menor");
  const adultos = hogar.miembros.filter((m) => m.tipo === "adulto").length;
  const hayPareja = adultos >= 2;
  const algunAdultoTrabaja = hogar.miembros.some(
    (m) => m.tipo === "adulto" && m.situacion === "trabaja",
  );

  // Tiempo de residencia: desde la mudanza (o empadronamiento si no hay mudanza)
  const refResidencia = caso.hitos.mudanza ?? caso.hitos.empadronado;
  const meses = mesesDesde(refResidencia);
  const subTiempo =
    meses >= 12 ? 1 : meses >= 6 ? 0.73 : meses >= 3 ? 0.47 : refResidencia ? 0.2 : 0;

  const senalToSub = (estado: string): number =>
    estado === "resuelto" ? 1 : estado === "en_proceso" ? 0.5 : 0;

  const factores: FactorArraigo[] = [
    {
      clave: "empleo_estable",
      etiqueta: "Empleo estable (≥1 adulto)",
      peso: 20,
      aplica: true,
      sub: caso.hitos.empleoResuelto ? 1 : algunAdultoTrabaja ? 0.5 : 0,
    },
    {
      clave: "empleo_pareja",
      etiqueta: "Empleo de la pareja",
      peso: 10,
      aplica: hayPareja,
      sub: caso.hitos.empleoPareja ? 1 : senalToSub(hogar.senales.empleo_pareja),
    },
    {
      clave: "vivienda_estable",
      etiqueta: "Vivienda estable",
      peso: 15,
      aplica: true,
      sub: caso.hitos.viviendaAsignada || caso.viviendaId ? 1 : 0,
    },
    {
      clave: "escolarizacion",
      etiqueta: "Escolarización de menores",
      peso: 20,
      aplica: hayMenores,
      sub: caso.hitos.menoresMatriculados
        ? 1
        : senalToSub(hogar.senales.escolarizacion),
    },
    {
      clave: "integracion",
      etiqueta: "Integración / participación local",
      peso: 10,
      aplica: true,
      sub: senalToSub(hogar.senales.integracion_social),
    },
    {
      clave: "tiempo",
      etiqueta: "Tiempo de residencia",
      peso: 15,
      aplica: true,
      sub: subTiempo,
    },
    {
      clave: "vinculos",
      etiqueta: "Vínculos previos en la zona",
      peso: 10,
      aplica: true,
      sub: hogar.vinculosPrevios ? 1 : 0,
    },
  ];

  const aplicables = factores.filter((f) => f.aplica);
  const pesoTotal = aplicables.reduce((s, f) => s + f.peso, 0) || 1;
  const acumulado = aplicables.reduce((s, f) => s + f.peso * f.sub, 0);
  const score = Math.round((100 * acumulado) / pesoTotal);

  return { score, banda: bandaArraigo(score), factores };
}

/* ============================================================
 *  ÍNDICE PUEBLIFY  (Mejora 4)
 *  Salud de captación de población de un municipio (0-100).
 *  Cinco palancas: Captación, Habilitadores, Familias, Retención, Momentum.
 * ============================================================ */

export interface ComponentePueblify {
  clave: string;
  etiqueta: string;
  peso: number;
  valor01: number; // 0..1 normalizado
  aplica: boolean; // false = no medible aún (se excluye del cálculo)
}

export type GradoPueblify = "A" | "B" | "C" | "D" | "E";

export interface ResultadoPueblify {
  score: number;
  grado: GradoPueblify;
  componentes: ComponentePueblify[];
  habitantesFijados: number;
  menoresIncorporados: number;
}

export function gradoPueblify(score: number): GradoPueblify {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  if (score >= 20) return "D";
  return "E";
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export interface DatosMunicipio {
  casos: Caso[];
  hogares: Hogar[];
  viviendas: Vivienda[];
  empresas: Empresa[];
}

export function calcularPueblify(
  municipio: Municipio,
  datos: DatosMunicipio,
): ResultadoPueblify {
  const casos = datos.casos.filter((c) => c.municipioDestinoId === municipio.id);

  const empadronados = casos.filter((c) => c.padron && c.estado !== "baja");
  const bajas = casos.filter((c) => c.estado === "baja" && c.padron);

  const habitantesFijados =
    empadronados.reduce((s, c) => s + (c.padron?.personas ?? 0), 0) -
    bajas.reduce((s, c) => s + (c.padron?.personas ?? 0), 0);

  const menoresIncorporados = empadronados.reduce(
    (s, c) => s + (c.padron?.menores ?? 0),
    0,
  );

  // 1) Captación (30): habitantes fijados vs objetivo
  const captacion = clamp01(habitantesFijados / Math.max(1, municipio.objetivoNuevos));

  // 2) Habilitadores (20): oferta de vivienda + empleo disponible
  const viviendasActivadas = datos.viviendas.filter(
    (v) => v.municipioId === municipio.id && v.estado === "publicada",
  ).length;
  const vacantes = datos.empresas
    .filter((e) => e.municipioId === municipio.id)
    .reduce((s, e) => s + e.vacantes, 0);
  const hogaresActivos =
    casos.filter((c) => c.estado === "interesado" || c.estado === "acompanamiento")
      .length || 1;
  const viviendaCobertura = clamp01(viviendasActivadas / hogaresActivos);
  const empleoDisponible = clamp01(vacantes / Math.max(1, municipio.objetivoNuevos));
  const habilitadores = (viviendaCobertura + empleoDisponible) / 2;

  // 3) Familias (20): menores incorporados vs los necesarios para la escuela
  const objetivoMenores = Math.max(1, municipio.umbralEscolar - municipio.matriculaEscolar);
  const familias = clamp01(menoresIncorporados / objetivoMenores);

  // 4) Retención (20): permanencia a 12 meses. Si todavía no hay elegibles
  //    (nadie cumple 12 meses), NO es medible: el componente se excluye del
  //    cálculo en lugar de inventar un valor que falsearía el índice.
  const ret = calcularRetencion(casos);
  const retencionAplica = ret.tasa !== null;
  const retencion = retencionAplica ? ret.tasa! / 100 : 0;

  // 5) Momentum (10): empadronamientos recientes vs antiguos
  const recientes = empadronados.filter((c) => mesesDesde(c.hitos.empadronado) <= 6).length;
  const antiguos = empadronados.length - recientes;
  const momentum =
    empadronados.length === 0
      ? 0.3
      : clamp01(0.5 + ((recientes - antiguos) / empadronados.length) * 0.5);

  const componentes: ComponentePueblify[] = [
    { clave: "captacion", etiqueta: "Captación", peso: 30, valor01: captacion, aplica: true },
    { clave: "habilitadores", etiqueta: "Habilitadores", peso: 20, valor01: habilitadores, aplica: true },
    { clave: "familias", etiqueta: "Familias", peso: 20, valor01: familias, aplica: true },
    { clave: "retencion", etiqueta: "Retención", peso: 20, valor01: retencion, aplica: retencionAplica },
    { clave: "momentum", etiqueta: "Momentum", peso: 10, valor01: momentum, aplica: true },
  ];

  // El score se calcula solo sobre los componentes aplicables (renormalizado).
  const aplicables = componentes.filter((c) => c.aplica);
  const pesoTotal = aplicables.reduce((s, c) => s + c.peso, 0) || 1;
  const score = Math.round((100 * aplicables.reduce((s, c) => s + c.peso * c.valor01, 0)) / pesoTotal);

  return {
    score,
    grado: gradoPueblify(score),
    componentes,
    habitantesFijados,
    menoresIncorporados,
  };
}
