"use client";

import { useActionState, useState, useTransition } from "react";
import { darDeBajaAction, empadronarAction } from "@/lib/actions";
import { Button, Input, Label, Select } from "@/components/ui";

export function EmpadronarForm({ casoId, sugeridoPersonas, sugeridoMenores }: { casoId: string; sugeridoPersonas: number; sugeridoMenores: number }) {
  const [state, formAction, pending] = useActionState(empadronarAction, null as null | { ok: boolean; errores?: Record<string, string[] | undefined> });
  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="casoId" value={casoId} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Personas empadronadas</Label>
          <Input type="number" name="personas" min={1} defaultValue={sugeridoPersonas} />
        </div>
        <div>
          <Label>De ellas, menores</Label>
          <Input type="number" name="menores" min={0} defaultValue={sugeridoMenores} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Fecha de empadronamiento</Label>
          <Input type="date" name="fecha" defaultValue={hoy} />
        </div>
        <div>
          <Label>Fuente (opcional)</Label>
          <Input name="fuente" placeholder="Volante de empadronamiento" />
        </div>
      </div>
      {state && !state.ok && (
        <p className="text-xs text-red-600">Revisa los datos del empadronamiento.</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Registrando…" : "Confirmar empadronamiento"}
      </Button>
    </form>
  );
}

const MOTIVOS = ["empleo", "vivienda", "servicios", "escolarizacion", "vinculos_sociales", "personal", "otro"];

export function BajaButton({ casoId }: { casoId: string }) {
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("servicios");
  const [pending, startTransition] = useTransition();

  if (!abierto) {
    return (
      <Button variant="danger" size="sm" onClick={() => setAbierto(true)}>
        Registrar baja
      </Button>
    );
  }
  return (
    <div className="flex items-end gap-2">
      <div>
        <Label>Motivo de la baja</Label>
        <Select value={motivo} onChange={(e) => setMotivo(e.target.value)} className="w-44">
          {MOTIVOS.map((m) => (
            <option key={m} value={m}>{m.replace("_", " ")}</option>
          ))}
        </Select>
      </div>
      <Button
        variant="danger"
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => darDeBajaAction(casoId, motivo))}
      >
        Confirmar
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setAbierto(false)}>
        Cancelar
      </Button>
    </div>
  );
}
