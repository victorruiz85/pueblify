import { formatFecha } from "@/lib/format";
import type { EstadoPaso, PasoCaso } from "@/lib/jornada";

const DOT: Record<EstadoPaso, string> = {
  completado: "bg-brand-500",
  pendiente: "bg-gray-300",
  vencido: "bg-[#c98b6b]",
};
const ETIQUETA: Record<EstadoPaso, string> = {
  completado: "Completado",
  pendiente: "Pendiente",
  vencido: "Vencido",
};
const TXT: Record<EstadoPaso, string> = {
  completado: "text-ink",
  pendiente: "text-muted",
  vencido: "text-[#9c5a4a]",
};

export function CaseSteps({ pasos }: { pasos: PasoCaso[] }) {
  return (
    <ol className="relative ml-1 border-l border-[#e3e7e3]">
      {pasos.map((p, i) => (
        <li key={i} className="mb-3 ml-4 last:mb-0">
          <span className={"absolute -left-[5px] mt-1 h-2.5 w-2.5 rounded-full " + DOT[p.estado]} />
          <div className="flex items-baseline justify-between gap-2">
            <span className={"text-sm " + TXT[p.estado]}>{p.titulo}</span>
            <span className="shrink-0 text-[11px] text-muted">
              {p.estado === "completado" && p.fecha ? formatFecha(p.fecha) : ETIQUETA[p.estado]}
            </span>
          </div>
          {p.detalle && <div className="text-xs text-muted">{p.detalle}</div>}
        </li>
      ))}
    </ol>
  );
}
