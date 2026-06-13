export function formatFecha(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function mesesDesde(iso?: string | null): number {
  if (!iso) return 0;
  const d = new Date(iso).getTime();
  const ahora = Date.now();
  return Math.max(0, Math.floor((ahora - d) / (1000 * 60 * 60 * 24 * 30.44)));
}

export function euros(n: number): string {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}
