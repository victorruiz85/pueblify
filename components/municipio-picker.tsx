"use client";

import { useMemo, useState } from "react";
import { Input, Label, Select } from "@/components/ui";
import type { MunicipioOficial } from "@/lib/types";

export type MunicipioSeleccion = {
  ineCode: string;
  nombre: string;
  provincia: string;
  cp: string;
};

/**
 * Cascada oficial provincia → municipio → CP (catálogo INE).
 * Reutilizable. Emite hidden inputs (`nameIne`, `nameCp`) para envíos nativos
 * y, si se pasa `onChange`, también notifica la selección (para react-hook-form).
 */
export function MunicipioPicker({
  municipios,
  nameIne = "municipioIne",
  nameCp = "cp",
  defaultIne = "",
  permitirVacio = true,
  etiquetaVacio = "— Sin asignar —",
  onChange,
}: {
  municipios: MunicipioOficial[];
  nameIne?: string;
  nameCp?: string;
  defaultIne?: string;
  permitirVacio?: boolean;
  etiquetaVacio?: string;
  onChange?: (sel: MunicipioSeleccion | null) => void;
}) {
  const provincias = useMemo(
    () => Array.from(new Set(municipios.map((m) => m.provincia))).sort((a, b) => a.localeCompare(b, "es")),
    [municipios],
  );
  const inicial = municipios.find((m) => m.ineCode === defaultIne) ?? null;
  const [provincia, setProvincia] = useState(inicial?.provincia ?? provincias[0] ?? "");
  const [ineCode, setIneCode] = useState(inicial?.ineCode ?? "");
  const [cp, setCp] = useState(inicial?.cp ?? "");

  const municipiosProvincia = useMemo(
    () => municipios.filter((m) => m.provincia === provincia),
    [municipios, provincia],
  );

  const onProvincia = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProvincia(e.target.value);
    setIneCode("");
    setCp("");
    onChange?.(null);
  };

  const onMunicipio = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const ine = e.target.value;
    const m = municipios.find((x) => x.ineCode === ine) ?? null;
    setIneCode(ine);
    setCp(m?.cp ?? "");
    onChange?.(m ? { ineCode: m.ineCode, nombre: m.nombre, provincia: m.provincia, cp: m.cp } : null);
  };

  const seleccionado = municipios.find((m) => m.ineCode === ineCode) ?? null;

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label>Provincia</Label>
          <Select value={provincia} onChange={onProvincia}>
            {provincias.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Municipio</Label>
          <Select value={ineCode} onChange={onMunicipio}>
            {permitirVacio && <option value="">{etiquetaVacio}</option>}
            {municipiosProvincia.map((m) => (
              <option key={m.ineCode} value={m.ineCode}>{m.nombre}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Código postal</Label>
          <Input value={cp} readOnly placeholder="— (lo pone el municipio)" />
        </div>
      </div>
      {seleccionado && (
        <p className="mt-2 text-xs text-muted">
          {seleccionado.poblacion.toLocaleString("es-ES")} hab. ·{" "}
          {seleccionado.colegios && seleccionado.colegios > 0
            ? `🏫 ${seleccionado.colegios} centro${seleccionado.colegios > 1 ? "s" : ""} (${seleccionado.etapasColegio})`
            : "🏫 sin centro educativo en el municipio"}
        </p>
      )}
      <input type="hidden" name={nameIne} value={ineCode} />
      <input type="hidden" name={nameCp} value={cp} />
    </div>
  );
}
