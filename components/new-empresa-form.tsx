"use client";

import { useActionState, useState } from "react";
import { crearEmpresaAction } from "@/lib/actions";
import { Button, Input, Label, Select } from "@/components/ui";

type Muni = { id: string; nombre: string; cp?: string };

export function NewEmpresaForm({ municipios }: { municipios: Muni[] }) {
  const [state, formAction, pending] = useActionState(
    crearEmpresaAction,
    null as null | { ok: boolean; errores?: Record<string, string[] | undefined> },
  );
  const [cp, setCp] = useState("");

  const onMuni = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const m = municipios.find((x) => x.id === e.target.value);
    setCp(m?.cp ?? "");
  };

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label>Nombre *</Label>
        <Input name="nombre" placeholder="Conservas del Pirineo" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Municipio</Label>
          <Select name="municipioId" onChange={onMuni} defaultValue="">
            <option value="">— Sin asignar —</option>
            {municipios.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Código postal</Label>
          <Input value={cp} readOnly placeholder="— (lo pone el municipio)" />
          <input type="hidden" name="cp" value={cp} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Sector</Label>
          <Input name="sector" placeholder="Agroalimentario" />
        </div>
        <div>
          <Label>Vacantes</Label>
          <Input name="vacantes" type="number" min={0} defaultValue={0} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" name="esTractora" className="h-4 w-4 rounded border-gray-300" />
        Es empresa tractora
      </label>
      {state && !state.ok && <p className="text-sm text-red-600">Revisa los datos (el nombre es obligatorio).</p>}
      <Button type="submit" disabled={pending}>{pending ? "Guardando…" : "Crear empresa"}</Button>
    </form>
  );
}
