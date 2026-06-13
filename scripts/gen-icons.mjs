// Generador del icon set de Pueblify. Fuente única → SVGs sueltos, spritesheet y React.
// Estilo: monoline, 24x24, sin relleno, trazo 2px, linecap/linejoin round. Color de marca #12312B.
// Ejecutar desde la raíz del proyecto:  node scripts/gen-icons.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const BRAND = "#12312B";

// id (kebab) → [etiqueta, markup interior]. El markup no lleva stroke/fill: se hereda del <svg>.
const ICONS = {
  "hogar": ["Hogar", `<path d="M4 11 11.2 4.6a1.2 1.2 0 0 1 1.6 0L20 11"/><path d="M6 9.6V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.6"/><path d="M12 16.6c-1.5-1.1-2.6-2-2.6-3.2A1.6 1.6 0 0 1 12 12a1.6 1.6 0 0 1 2.6 1.4c0 1.2-1.1 2.1-2.6 3.2Z"/>`],
  "caso": ["Caso", `<path d="M4 7a1 1 0 0 1 1-1h3.8l1.6 2H19a1 1 0 0 1 1 1v8.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z"/>`],
  "arraigo": ["Arraigo", `<path d="M12 21v-8.5"/><path d="M12 12.5a4 4 0 0 1 4-4 4 4 0 0 1-4 4Z"/><path d="M12 13.5a4 4 0 0 0-4-4 4 4 0 0 0 4 4Z"/><path d="M8.5 21c1.2-1 2.3-2.2 3.5-3.6 1.2 1.4 2.3 2.6 3.5 3.6"/>`],
  "habitantes-fijados": ["Habitantes fijados", `<circle cx="10" cy="8" r="3"/><path d="M4 20c0-3.3 2.7-6 6-6 .9 0 1.7.2 2.5.5"/><path d="M14.5 18.2 16.3 20 21 15.6"/>`],
  "empadronamiento": ["Empadronamiento", `<rect x="5" y="4.5" width="14" height="16" rx="2"/><path d="M9.5 4.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v.8a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1Z"/><path d="M8.6 13l2 2 4-4.2"/>`],
  "asentado": ["Asentado", `<path d="M5 11 12 5.2 19 11"/><path d="M7 10v9a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-9"/><path d="M9.4 15.2 11.1 17l3.5-3.6"/>`],
  "proximo-paso": ["Próximo paso", `<path d="M6 21V4"/><path d="M6 5h11l-2 3 2 3H6"/>`],
  "tarea": ["Tarea", `<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M8.4 12.2l2.4 2.4L16 9.4"/>`],
  "llamada": ["Llamada", `<path d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 4.5 6a2 2 0 0 1 2-2Z"/>`],
  "visita": ["Visita", `<path d="M12 21s6-5.3 6-10a6 6 0 0 0-12 0c0 4.7 6 10 6 10Z"/><circle cx="12" cy="11" r="2.3"/>`],
  "nota": ["Nota", `<path d="M6 3.5h8l5 5v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z"/><path d="M14 3.5v5h5"/><path d="M8.5 13h7M8.5 16.5h4.5"/>`],
  "municipio": ["Municipio", `<path d="M3 21h18"/><path d="M6 21V9l3.5-2.6L13 9v12"/><path d="M13 21v-7.5h5V21"/><path d="M9 12.5v2"/>`],
  "empresa": ["Empresa", `<rect x="5" y="3.5" width="11" height="17" rx="1"/><path d="M16 9.5h3V20"/><path d="M8 7.5h2M12 7.5h1.5M8 11h2M12 11h1.5M8 14.5h2M12 14.5h1.5"/><path d="M10 20.5v-3h2v3"/>`],
  "empleo": ["Empleo", `<rect x="3.5" y="7.5" width="17" height="12.5" rx="2"/><path d="M9 7.5V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.5"/><path d="M3.5 12.5h17"/>`],
  "vivienda": ["Vivienda", `<path d="M5 11 12 5.2 19 11"/><path d="M7 10v9a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-9"/><path d="M10.5 20v-4h3v4"/>`],
  "familia": ["Familia", `<circle cx="8" cy="8" r="2.4"/><path d="M3.6 19c0-2.6 2-4.6 4.4-4.6 1.5 0 2.9.8 3.7 2"/><circle cx="16.4" cy="9.2" r="2"/><path d="M12.9 18.6c.4-2.1 1.9-3.6 3.6-3.6 1.6 0 3 1.2 3.5 3"/>`],
  "riesgo": ["Riesgo", `<path d="M8.4 3.2h7.2L20.8 8.4v7.2l-5.2 5.2H8.4L3.2 15.6V8.4Z"/><path d="M12 8v4.2"/><path d="M12 16h0"/>`],
  "atencion": ["Atención", `<path d="M10.3 4.4 2.9 17.5A2 2 0 0 0 4.6 20.5h14.8a2 2 0 0 0 1.7-3L13.7 4.4a2 2 0 0 0-3.4 0Z"/><path d="M12 9.5v4"/><path d="M12 17h0"/>`],
  "correcto": ["Correcto", `<circle cx="12" cy="12" r="8.5"/><path d="M8.4 12.2l2.5 2.5 4.7-4.9"/>`],
  "indice-pueblify": ["Índice Pueblify", `<path d="M4 16a8 8 0 0 1 16 0"/><path d="M4 16h16"/><path d="M12 16l4.2-3.6"/><circle cx="12" cy="16" r="1.1"/>`],
  "retencion": ["Retención", `<circle cx="12" cy="12" r="8.4"/><path d="M12 7.4v4.8l3.2 2"/>`],
  "crecimiento": ["Crecimiento", `<path d="M3 17l5.6-5.6 3.4 3.4L21 7"/><path d="M15 7h6v6"/>`],
  "impacto": ["Impacto", `<circle cx="12" cy="12" r="1.6"/><path d="M8.8 8.8a4.5 4.5 0 0 0 0 6.4M15.2 8.8a4.5 4.5 0 0 1 0 6.4"/><path d="M6.4 6.4a8 8 0 0 0 0 11.2M17.6 6.4a8 8 0 0 1 0 11.2"/>`],
};

const ROOT = `fill="none" stroke="${BRAND}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;

mkdirSync("icons", { recursive: true });

// 1) SVGs sueltos
for (const [id, [, inner]] of Object.entries(ICONS)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ${ROOT}>${inner}</svg>\n`;
  writeFileSync(`icons/${id}.svg`, svg);
}

// 2) Spritesheet (currentColor para poder tematizar)
const symbols = Object.entries(ICONS)
  .map(([id, [, inner]]) => `  <symbol id="pf-${id}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</symbol>`)
  .join("\n");
writeFileSync(
  "icons/pueblify-icons.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">\n${symbols}\n</svg>\n`,
);

// 3) Componente React
const mapTs = Object.entries(ICONS).map(([id, [, inner]]) => `  "${id}": \`${inner}\`,`).join("\n");
const labelsTs = Object.entries(ICONS).map(([id, [label]]) => `  "${id}": "${label}",`).join("\n");
writeFileSync(
  "components/Icon.tsx",
  `// Icon set de Pueblify — monoline, 24x24, trazo 2px round. Color de marca ${BRAND}.
// Generado por scripts/gen-icons.mjs. Compatible en uso con Lucide/Heroicons.
import * as React from "react";

export const ICONS = {
${mapTs}
} as const;

export const ICON_LABELS: Record<IconName, string> = {
${labelsTs}
};

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  size = 24,
  color,
  className,
  title,
  ...rest
}: {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
  title?: string;
} & Omit<React.SVGProps<SVGSVGElement>, "name" | "color">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={className}
      dangerouslySetInnerHTML={{ __html: (title ? \`<title>\${title}</title>\` : "") + ICONS[name] }}
      {...rest}
    />
  );
}
`,
);

console.log(`Generados ${Object.keys(ICONS).length} iconos en /icons, sprite y components/Icon.tsx`);
