"use client";

import { useActionState } from "react";
import { crearEmpresaAction } from "@/lib/actions";
import { Button, Input, Label } from "@/components/ui";
import { MunicipioPicker } from "@/components/municipio-picker";
import type { MunicipioOficial } from "@/lib/types";

export function NewEmpresaForm({ municipios }: { municipios: MunicipioOficial[] }) {
  const [state, formAction, pending] = useActionState(
    crearEmpresaAction,
    null as null | { ok: boolean; errores?: Record<string, string[] | undefined> },
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label>Nombre *</Label>
        <Input name="nombre" placeholder="Conservas del Pirineo" />
      </div>
      <MunicipioPicker municipios={municipios} nameIne="municipioIne" nameCp="cp" />
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
