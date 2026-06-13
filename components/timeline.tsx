import { formatFecha } from "@/lib/format";
import type { EventoTimeline } from "@/lib/jornada";

const COLOR: Record<EventoTimeline["tipo"], string> = {
  alta: "bg-gray-400",
  hito: "bg-brand-500",
  padron: "bg-brand-700",
  retencion: "bg-amber-500",
  baja: "bg-red-500",
};

export function Timeline({ eventos }: { eventos: EventoTimeline[] }) {
  if (eventos.length === 0) {
    return <p className="text-sm text-muted">Sin eventos todavía.</p>;
  }
  return (
    <ol className="relative ml-1 border-l border-[#e3e7e3]">
      {eventos.map((e, i) => (
        <li key={i} className="mb-4 ml-4 last:mb-0">
          <span className={"absolute -left-[5px] mt-1 h-2.5 w-2.5 rounded-full " + COLOR[e.tipo]} />
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-medium text-ink">{e.titulo}</span>
            <span className="shrink-0 text-xs text-muted">{formatFecha(e.fecha)}</span>
          </div>
          {e.detalle && <div className="text-xs text-muted">{e.detalle}</div>}
        </li>
      ))}
    </ol>
  );
}
