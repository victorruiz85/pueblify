// Microcopy de ayuda contextual: pequeño "ⓘ" con explicación al pasar el ratón.
export const AYUDA = {
  arraigo:
    "Estimación simple del riesgo de que un hogar abandone el municipio. No es una predicción exacta; sirve para priorizar el acompañamiento.",
  habitantesFijados:
    "Personas empadronadas a través del programa, descontando bajas confirmadas.",
  asentado:
    "Un hogar se considera asentado cuando permanece al menos 12 meses tras el empadronamiento.",
  instalado: "Un hogar pasa a Instalado cuando se confirma su empadronamiento.",
  emparejado:
    "Vivienda y empleo principal resueltos, pero todavía sin mudanza ni empadronamiento.",
  pueblify:
    "Salud de captación de población de un municipio (0–100). Combina captación, habilitadores, familias, retención y tendencia.",
} as const;

export function Hint({ texto }: { texto: string }) {
  return (
    <span
      title={texto}
      aria-label={texto}
      className="ml-1 inline-block cursor-help align-middle text-xs text-muted"
    >
      ⓘ
    </span>
  );
}
