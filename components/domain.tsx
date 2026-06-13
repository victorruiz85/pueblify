// Componentes de dominio (presentacionales).
import { cn } from "@/lib/cn";
import { Badge, Card, CardContent } from "@/components/ui";
import type { BandaArraigo, ResultadoPueblify } from "@/lib/indices";
import { ETIQUETA_BANDA } from "@/lib/indices";

/* -------- Cabecera de página -------- */
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* -------- StatCard -------- */
export function StatCard({ label, value, hint, tone = "neutral" }: { label: React.ReactNode; value: React.ReactNode; hint?: string; tone?: "neutral" | "green" }) {
  return (
    <Card className={cn(tone === "green" && "border-brand-200 bg-brand-50")}>
      <CardContent className="py-4">
        <div className="text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
        <div className="mt-1 text-3xl font-bold text-ink">{value}</div>
        {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
      </CardContent>
    </Card>
  );
}

/* -------- Badge de Arraigo (colores suaves, no alarmistas) -------- */
const ARRAIGO_ESTILO: Record<BandaArraigo, string> = {
  arraigado: "bg-[#e8f1ec] text-[#2f7355]", // verde suave 70–100
  fragil: "bg-[#f6efdd] text-[#8a6a2a]", // ámbar suave 40–69
  riesgo: "bg-[#f3e7e4] text-[#9c5a4a]", // rojo suave 0–39
};

export function ArraigoBadge({ score, banda }: { score: number; banda: BandaArraigo }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        ARRAIGO_ESTILO[banda],
      )}
    >
      Arraigo {score} · {ETIQUETA_BANDA[banda]}
    </span>
  );
}

/* -------- Gauge del Índice Pueblify -------- */
const GRADO_COLOR: Record<string, string> = {
  A: "#2f7355",
  B: "#5aa57e",
  C: "#b5803a",
  D: "#c4763a",
  E: "#a8543f",
};

export function PueblifyGauge({ resultado, nombre }: { resultado: ResultadoPueblify; nombre: string }) {
  const color = GRADO_COLOR[resultado.grado];
  return (
    <div className="flex items-center gap-4">
      <div
        className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full text-white"
        style={{ background: color }}
      >
        <div className="text-2xl font-bold leading-none">{resultado.score}</div>
        <div className="text-[11px] opacity-90">Grado {resultado.grado}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 text-sm font-semibold text-ink">{nombre}</div>
        <div className="space-y-1">
          {resultado.componentes.map((c) => (
            <div key={c.clave} className="flex items-center gap-2">
              <span className="w-24 shrink-0 text-[11px] text-muted">{c.etiqueta}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                {c.aplica && (
                  <div className="h-full rounded-full bg-brand-400" style={{ width: `${Math.round(c.valor01 * 100)}%` }} />
                )}
              </div>
              <span className="w-7 text-right text-[11px] tabular-nums text-muted">
                {c.aplica ? Math.round(c.valor01 * 100) : "n/d"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------- Embudo de atracción -------- */
export function Funnel({ etapas }: { etapas: { label: string; valor: number; pct: number }[] }) {
  return (
    <div className="space-y-2">
      {etapas.map((e, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-36 shrink-0 text-sm text-ink">{e.label}</span>
          <div className="h-7 flex-1 overflow-hidden rounded-md bg-gray-100">
            <div
              className="flex h-full items-center justify-end rounded-md bg-brand-500 pr-2 text-xs font-semibold text-white"
              style={{ width: `${Math.max(6, e.pct)}%` }}
            >
              {e.valor}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
