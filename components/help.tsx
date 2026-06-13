// Bloque de ayuda dentro de la interfaz. Explica los indicadores clave.
// Usa <details> nativo (plegable, sin JS). Es texto explicativo, no una funcionalidad.

const DEFINICIONES: { termino: string; texto: string }[] = [
  {
    termino: "Habitantes fijados",
    texto:
      "Personas empadronadas a través de Pueblify que cuentan como nuevos vecinos, restando las bajas. Es la métrica estrella: mide población real instalada, no viviendas alquiladas.",
  },
  {
    termino: "Índice de Arraigo",
    texto:
      "Puntuación 0–100 de un hogar que estima su probabilidad de quedarse, a partir de factores observables (empleo estable, vivienda, escolarización de menores, integración, tiempo de residencia, vínculos previos). Es un indicador adelantado para priorizar el acompañamiento: Arraigado (≥70), Frágil (40–69), En riesgo (<40).",
  },
  {
    termino: "Índice Pueblify",
    texto:
      "Puntuación 0–100 (grado A–E) de la salud de captación de población de un municipio. Combina cinco palancas: captación, habilitadores (vivienda y empleo), familias (menores), retención y momentum. Permite comparar municipios.",
  },
  {
    termino: "Estado Instalado / Asentado",
    texto:
      "Instalado = el hogar ya se ha empadronado. Asentado = lleva empadronado 12 meses o más (permanencia confirmada). Ambos se calculan automáticamente desde el empadronamiento; no se marcan a mano.",
  },
];

export function InfoHelp() {
  return (
    <details className="mb-6 rounded-xl border border-[#e3e7e3] bg-white">
      <summary className="cursor-pointer list-none px-5 py-3 text-sm font-semibold text-ink">
        <span className="mr-2 text-brand-600">ⓘ</span>¿Qué significan estos indicadores?
      </summary>
      <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
        {DEFINICIONES.map((d) => (
          <div key={d.termino}>
            <div className="text-sm font-semibold text-brand-700">{d.termino}</div>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">{d.texto}</p>
          </div>
        ))}
      </div>
    </details>
  );
}
