"use client";

import { useTransition } from "react";
import { alternarHitoAction } from "@/lib/actions";
import { ETIQUETA_HITO, type Hitos } from "@/lib/types";
import { formatFecha } from "@/lib/format";

const VISIBLES: (keyof Hitos)[] = [
  "viviendaAsignada",
  "empleoResuelto",
  "empleoPareja",
  "menoresMatriculados",
  "mudanza",
];

export function HitoChecklist({
  casoId,
  hitos,
  hayMenores,
  hayPareja,
}: {
  casoId: string;
  hitos: Hitos;
  hayMenores: boolean;
  hayPareja: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const visibles = VISIBLES.filter((h) => {
    if (h === "empleoPareja") return hayPareja;
    if (h === "menoresMatriculados") return hayMenores;
    return true;
  });

  return (
    <ul className="space-y-1.5">
      {visibles.map((h) => {
        const done = Boolean(hitos[h]);
        return (
          <li key={h}>
            <button
              disabled={pending}
              onClick={() => startTransition(() => alternarHitoAction(casoId, h))}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-gray-50 disabled:opacity-60"
            >
              <span
                className={
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs " +
                  (done ? "border-brand-500 bg-brand-500 text-white" : "border-gray-300 bg-white text-transparent")
                }
              >
                ✓
              </span>
              <span className={done ? "text-ink" : "text-muted"}>{ETIQUETA_HITO[h]}</span>
              {done && <span className="ml-auto text-xs text-muted">{formatFecha(hitos[h])}</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
