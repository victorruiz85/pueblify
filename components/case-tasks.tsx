"use client";

import { useState, useTransition } from "react";
import { agregarTareaAction, completarTareaAction } from "@/lib/actions";
import { ETIQUETA_TAREA_TIPO, type TareaCaso, type TareaPrioridad, type TareaTipo } from "@/lib/types";
import { Button, Input, Select } from "@/components/ui";
import { formatFecha } from "@/lib/format";

const PRIO_DOT: Record<TareaPrioridad, string> = {
  alta: "bg-[#c98b6b]",
  media: "bg-amber-400",
  baja: "bg-gray-300",
};

export function CaseTasks({ casoId, tareas }: { casoId: string; tareas: TareaCaso[] }) {
  const [pending, start] = useTransition();
  const [texto, setTexto] = useState("");
  const [tipo, setTipo] = useState<TareaTipo>("llamada");
  const [prioridad, setPrioridad] = useState<TareaPrioridad>("media");
  const [fecha, setFecha] = useState("");

  const pendientes = tareas.filter((t) => t.estado === "pendiente");
  const hechas = tareas.filter((t) => t.estado === "completada");

  const agregar = () => {
    if (!texto.trim()) return;
    start(async () => {
      await agregarTareaAction(casoId, { texto, tipo, prioridad, fecha: fecha || undefined });
      setTexto("");
      setFecha("");
    });
  };

  return (
    <div className="space-y-3">
      {pendientes.length === 0 && hechas.length === 0 && (
        <p className="text-sm text-muted">Sin tareas. Añade la primera abajo.</p>
      )}

      {pendientes.length > 0 && (
        <ul className="space-y-1.5">
          {pendientes.map((t) => (
            <li key={t.id} className="flex items-start gap-2 text-sm">
              <button
                disabled={pending}
                onClick={() => start(() => completarTareaAction(casoId, t.id))}
                title="Marcar completada"
                className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-gray-300 text-[10px] text-transparent hover:border-brand-500 hover:text-brand-500"
              >
                ✓
              </button>
              <span className={"mt-1.5 h-2 w-2 shrink-0 rounded-full " + PRIO_DOT[t.prioridad]} />
              <span className="min-w-0">
                <span className="text-ink">{t.texto}</span>
                <span className="text-muted">
                  {" "}· {ETIQUETA_TAREA_TIPO[t.tipo]}
                  {t.fecha ? ` · ${formatFecha(t.fecha)}` : ""}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {hechas.length > 0 && (
        <ul className="space-y-1 border-t border-gray-100 pt-2">
          {hechas.map((t) => (
            <li key={t.id} className="flex items-center gap-2 text-sm text-muted line-through">
              <span className="flex h-4 w-4 items-center justify-center rounded bg-brand-500 text-[10px] text-white">✓</span>
              {t.texto}
            </li>
          ))}
        </ul>
      )}

      {/* Añadir tarea rápida */}
      <div className="rounded-lg border border-dashed border-gray-200 p-2">
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Añadir tarea (p. ej. llamar al propietario)"
          className="mb-2"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Select value={tipo} onChange={(e) => setTipo(e.target.value as TareaTipo)} className="h-9 w-32">
            {(Object.keys(ETIQUETA_TAREA_TIPO) as TareaTipo[]).map((k) => (
              <option key={k} value={k}>{ETIQUETA_TAREA_TIPO[k]}</option>
            ))}
          </Select>
          <Select value={prioridad} onChange={(e) => setPrioridad(e.target.value as TareaPrioridad)} className="h-9 w-28">
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </Select>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="h-9 w-40" />
          <Button size="sm" onClick={agregar} disabled={pending || !texto.trim()}>
            Añadir
          </Button>
        </div>
      </div>
    </div>
  );
}
