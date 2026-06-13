"use client";

import { useTransition } from "react";
import { actualizarSenalAction } from "@/lib/actions";
import { ETIQUETA_SENAL, type CategoriaSenal, type EstadoSenal, type Senales } from "@/lib/types";
import { cn } from "@/lib/cn";

const CATEGORIAS: CategoriaSenal[] = [
  "empleo_pareja",
  "escolarizacion",
  "transporte",
  "teletrabajo",
  "dependencia",
  "conciliacion",
  "integracion_social",
];

const ESTADOS: { v: EstadoSenal; label: string }[] = [
  { v: "necesario", label: "Necesario" },
  { v: "en_proceso", label: "En proceso" },
  { v: "resuelto", label: "Resuelto" },
  { v: "no_aplica", label: "No aplica" },
];

const COLOR: Record<EstadoSenal, string> = {
  necesario: "bg-red-50 text-red-600",
  en_proceso: "bg-amber-50 text-amber-700",
  resuelto: "bg-brand-50 text-brand-700",
  no_aplica: "bg-gray-100 text-gray-500",
};

export function SignalsEditor({ hogarId, casoId, senales }: { hogarId: string; casoId: string; senales: Senales }) {
  const [pending, startTransition] = useTransition();
  return (
    <ul className="space-y-2">
      {CATEGORIAS.map((cat) => (
        <li key={cat} className="flex items-center justify-between gap-3">
          <span className="text-sm text-ink">{ETIQUETA_SENAL[cat]}</span>
          <div className="flex gap-1">
            {ESTADOS.map((e) => {
              const activo = senales[cat] === e.v;
              return (
                <button
                  key={e.v}
                  disabled={pending}
                  onClick={() => startTransition(() => actualizarSenalAction(hogarId, cat, e.v, casoId))}
                  className={cn(
                    "rounded px-2 py-0.5 text-[11px] font-medium transition-colors disabled:opacity-50",
                    activo ? COLOR[e.v] : "bg-white text-gray-400 hover:bg-gray-50",
                  )}
                >
                  {e.label}
                </button>
              );
            })}
          </div>
        </li>
      ))}
    </ul>
  );
}
