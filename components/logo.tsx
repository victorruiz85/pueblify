// Símbolo de marca Pueblify (P + casa + línea de territorio), extraído del logo.
// Usa currentColor: el color se controla con CSS (text-white, text-brand-700, …).
export function PueblifyMark({ className }: { className?: string }) {
  return (
    <svg viewBox="48 18 304 318" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g stroke="currentColor" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round">
        <path d="M65 285 V35 H185 C265 35 325 95 325 175 C325 255 265 315 185 315 H65" />
        <path d="M65 235 C128 202 198 196 280 225" />
        <path d="M135 190 V128 L185 86 L235 128 V190" />
      </g>
    </svg>
  );
}
