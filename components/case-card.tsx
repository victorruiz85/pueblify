"use client";

import Link from "next/link";
import { useTransition } from "react";
import { moverCasoAction } from "@/lib/actions";
import { ESTADOS_MANUALES } from "@/lib/transitions";
import { type EstadoCaso } from "@/lib/types";
import type { BandaArraigo } from "@/lib/indices";
import { ArraigoBadge } from "@/components/domain";
import { Icon } from "@/components/Icon";
import { formatFecha } from "@/lib/format";

export interface CaseCardData {
  id: string;
  contacto: string;
  municipio: string;
  tamano: number;
  estado: EstadoCaso;
  arraigoScore: number;
  arraigoBanda: BandaArraigo;
  proximoHito?: string;
  proximoHitoFecha?: string;
  alertas: string[];
}

export function CaseCard({ data }: { data: CaseCardData }) {
  const [pending, startTransition] = useTransition();
  const idx = ESTADOS_MANUALES.indexOf(data.estado);
  const esManual = idx !== -1;

  return (
    <div className="rounded-xl border border-[#e3e7e3] bg-white p-3 shadow-sm">
      <Link href={`/casos/${data.id}`} className="block">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-semibold text-ink hover:text-brand-700">{data.contacto}</span>
        </div>
        <div className="mt-0.5 text-xs text-muted">
          {data.municipio} · {data.tamano} pers.
        </div>
        <div className="mt-2">
          <ArraigoBadge score={data.arraigoScore} banda={data.arraigoBanda} />
        </div>
        {data.proximoHito && (
          <div className="mt-2 text-xs text-muted">
            <span className="font-medium text-ink">Próximo:</span> {data.proximoHito}
            {data.proximoHitoFecha ? ` · ${formatFecha(data.proximoHitoFecha)}` : ""}
          </div>
        )}
        {data.alertas.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {data.alertas.map((a, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                <Icon name="atencion" size={11} />
                {a}
              </span>
            ))}
          </div>
        )}
      </Link>
      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2">
        {esManual ? (
          <>
            <button
              disabled={pending || idx <= 0}
              onClick={() => startTransition(() => moverCasoAction(data.id, ESTADOS_MANUALES[idx - 1]))}
              className="text-xs text-muted hover:text-brand-700 disabled:opacity-30"
            >
              ← Atrás
            </button>
            <button
              disabled={pending || idx >= ESTADOS_MANUALES.length - 1}
              onClick={() => startTransition(() => moverCasoAction(data.id, ESTADOS_MANUALES[idx + 1]))}
              className="text-xs font-medium text-brand-700 hover:text-brand-800 disabled:opacity-30"
            >
              Avanzar →
            </button>
          </>
        ) : (
          <span className="text-[10px] text-muted">Estado automático (empadronamiento)</span>
        )}
      </div>
    </div>
  );
}
