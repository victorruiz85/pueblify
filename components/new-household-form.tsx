"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { crearHogarAction } from "@/lib/actions";
import { nuevoHogarSchema, type NuevoHogarValues } from "@/lib/validators";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select } from "@/components/ui";
import { MunicipioPicker } from "@/components/municipio-picker";
import { ETIQUETA_SENAL, type CategoriaSenal, type MunicipioOficial } from "@/lib/types";

const SENALES: CategoriaSenal[] = [
  "empleo_pareja",
  "escolarizacion",
  "transporte",
  "teletrabajo",
  "dependencia",
  "conciliacion",
  "integracion_social",
];

export function NewHouseholdForm({
  municipios,
  empresas,
}: {
  municipios: MunicipioOficial[];
  empresas: { id: string; nombre: string }[];
}) {
  const [enviando, setEnviando] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<NuevoHogarValues>({
    resolver: zodResolver(nuevoHogarSchema),
    defaultValues: {
      numAdultos: 1,
      numMenores: 0,
      origen: "exodo_urbano",
      canal: "gal",
      municipioDestinoIne: "",
      vinculosPrevios: false,
      empleo_pareja: "no_aplica",
      escolarizacion: "no_aplica",
      transporte: "no_aplica",
      teletrabajo: "no_aplica",
      dependencia: "no_aplica",
      conciliacion: "no_aplica",
      integracion_social: "necesario",
      consentimiento: false,
    },
  });

  const onSubmit = async (values: NuevoHogarValues) => {
    setEnviando(true);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.append(k, String(v ?? "")));
    try {
      await crearHogarAction(null, fd);
    } catch (e) {
      // NEXT_REDIRECT se propaga como excepción controlada: navegación correcta.
      throw e;
    }
  };

  const err = (k: keyof NuevoHogarValues) =>
    errors[k] ? <p className="mt-1 text-xs text-red-600">{String(errors[k]?.message)}</p> : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Datos del hogar</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Hogar / persona de contacto *</Label>
            <Input {...register("contacto")} placeholder="Familia Gómez Soler" />
            {err("contacto")}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input {...register("email")} type="email" placeholder="correo@example.com" />
              {err("email")}
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input {...register("telefono")} placeholder="6XX XXX XXX" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nº de adultos *</Label>
              <Input {...register("numAdultos")} type="number" min={1} />
              {err("numAdultos")}
            </div>
            <div>
              <Label>Nº de menores</Label>
              <Input {...register("numMenores")} type="number" min={0} />
            </div>
          </div>
          <div>
            <Label>Origen</Label>
            <Select {...register("origen")}>
              <option value="exodo_urbano">Éxodo urbano</option>
              <option value="retorno">Retorno</option>
              <option value="internacional">Internacional</option>
              <option value="movilidad_local">Movilidad local</option>
            </Select>
            <p className="mt-1 text-xs text-muted">Solo la categoría (no se registra el país concreto, por minimización de datos).</p>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" {...register("vinculosPrevios")} className="h-4 w-4 rounded border-gray-300" />
            Tiene vínculos previos en la zona
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Destino y canal</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Municipio destino</Label>
            <MunicipioPicker
              municipios={municipios}
              permitirVacio
              etiquetaVacio="— Sin asignar (decidir después) —"
              onChange={(sel) => setValue("municipioDestinoIne", sel?.ineCode ?? "")}
            />
            <p className="mt-1 text-xs text-muted">Se elige del listado oficial de Navarra; el CP se asigna solo.</p>
          </div>
          <div>
            <Label>Canal de entrada</Label>
            <Select {...register("canal")}>
              <option value="gal">Grupo LEADER / GAL</option>
              <option value="empresa">Empresa tractora</option>
              <option value="ayuntamiento">Ayuntamiento</option>
              <option value="web">Web</option>
              <option value="evento">Evento</option>
            </Select>
          </div>
          <div>
            <Label>Empresa vinculada (opcional)</Label>
            <Select {...register("empresaId")}>
              <option value="">— Ninguna —</option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Señales de arraigo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted">Marca solo lo que ya sepas. El resto se completa durante el acompañamiento.</p>
          {SENALES.map((s) => (
            <div key={s} className="grid grid-cols-2 items-center gap-4">
              <Label className="mb-0">{ETIQUETA_SENAL[s]}</Label>
              <Select {...register(s)}>
                <option value="no_aplica">No aplica</option>
                <option value="necesario">Necesario</option>
                <option value="en_proceso">En proceso</option>
                <option value="resuelto">Resuelto</option>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Protección de datos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <details className="rounded-lg border border-[#e3e7e3] bg-gray-50 p-3 text-xs leading-relaxed text-muted">
            <summary className="cursor-pointer font-medium text-ink">Aviso de privacidad (resumen)</summary>
            <p className="mt-2">
              Los datos del hogar se tratan para gestionar su acompañamiento en el programa de atracción de
              población. Se recoge el mínimo imprescindible; los menores se registran sin nombre (solo edad y
              etapa). No se toman decisiones automatizadas: los índices son una ayuda para el técnico. El hogar
              puede ejercer sus derechos de acceso, rectificación, supresión y oposición ante el responsable del
              tratamiento. El texto legal completo lo facilita el responsable (ver PRIVACIDAD.md).
            </p>
          </details>
          <label className="flex items-start gap-2 text-sm text-ink">
            <input type="checkbox" {...register("consentimiento")} className="mt-0.5 h-4 w-4 rounded border-gray-300" />
            <span>He informado al hogar y cuenta con su consentimiento para el tratamiento de sus datos (incluidos los menores). *</span>
          </label>
          {err("consentimiento")}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={enviando}>
          {enviando ? "Creando…" : "Crear caso"}
        </Button>
      </div>
    </form>
  );
}
