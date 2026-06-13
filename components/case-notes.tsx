"use client";

import { useState, useTransition } from "react";
import { actualizarNotaAction, fijarProximoPasoAction } from "@/lib/actions";
import { Button, Input } from "@/components/ui";

export function CaseNotes({ casoId, nota }: { casoId: string; nota?: string }) {
  const [texto, setTexto] = useState(nota ?? "");
  const [pending, start] = useTransition();
  const [guardado, setGuardado] = useState(false);

  return (
    <div className="space-y-2">
      <textarea
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setGuardado(false);
        }}
        rows={4}
        placeholder="Notas internas del técnico…"
        className="w-full rounded-lg border border-[#d4ddd6] bg-white p-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
      />
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => start(async () => { await actualizarNotaAction(casoId, texto); setGuardado(true); })}
        >
          {pending ? "Guardando…" : "Guardar nota"}
        </Button>
        {guardado && <span className="text-xs text-brand-700">Guardado</span>}
      </div>
    </div>
  );
}

export function NextStep({ casoId, texto, fecha }: { casoId: string; texto?: string; fecha?: string }) {
  const [t, setT] = useState(texto ?? "");
  const [f, setF] = useState(fecha ? fecha.slice(0, 10) : "");
  const [pending, start] = useTransition();
  const [ok, setOk] = useState(false);

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="min-w-0 flex-1">
        <Input value={t} onChange={(e) => { setT(e.target.value); setOk(false); }} placeholder="Próximo paso" />
      </div>
      <Input
        type="date"
        value={f}
        onChange={(e) => { setF(e.target.value); setOk(false); }}
        className="w-40"
      />
      <Button
        size="sm"
        variant="outline"
        disabled={pending || !t.trim()}
        onClick={() =>
          start(async () => {
            await fijarProximoPasoAction(casoId, t.trim(), f ? new Date(f).toISOString() : undefined);
            setOk(true);
          })
        }
      >
        {pending ? "Guardando…" : "Actualizar"}
      </Button>
      {ok && <span className="text-xs text-brand-700">Actualizado</span>}
    </div>
  );
}
