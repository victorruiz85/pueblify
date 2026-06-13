import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { ArraigoBadge } from "@/components/domain";
import { HitoChecklist } from "@/components/hito-checklist";
import { SignalsEditor } from "@/components/signals-editor";
import { BajaButton, EmpadronarForm } from "@/components/case-actions";
import { CaseSteps } from "@/components/case-steps";
import { CaseTasks } from "@/components/case-tasks";
import { CaseNotes, NextStep } from "@/components/case-notes";
import { AYUDA, Hint } from "@/components/hint";
import { Icon } from "@/components/Icon";
import { calcularArraigo } from "@/lib/indices";
import { pasosDelCaso } from "@/lib/jornada";
import { getRepo } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { ETIQUETA_CANAL, ETIQUETA_ESTADO, ETIQUETA_ORIGEN, ETIQUETA_SENAL, type EstadoCaso } from "@/lib/types";
import { euros, formatFecha } from "@/lib/format";

export const dynamic = "force-dynamic";

const TONO_ESTADO: Record<EstadoCaso, "neutral" | "green" | "amber" | "earth" | "red"> = {
  interesado: "neutral",
  acompanamiento: "amber",
  emparejado: "earth",
  instalado: "green",
  asentado: "green",
  baja: "red",
};

function Dato({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted">{k}</span>
      <span className="text-right font-medium text-ink">{v}</span>
    </div>
  );
}

export default async function CasoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repo = getRepo();
  const caso = await repo.getCaso(id);
  if (!caso) notFound();

  const hogar = await repo.getHogar(caso.hogarId);
  if (!hogar) notFound();
  const session = await getSession();

  const [municipios, viviendas] = await Promise.all([repo.getMunicipios(), repo.getViviendas()]);
  const municipio = caso.municipioDestinoId ? municipios.find((m) => m.id === caso.municipioDestinoId) ?? null : null;
  const empresa = caso.empresaId ? await repo.getEmpresa(caso.empresaId) : null;
  const vivienda = caso.viviendaId ? viviendas.find((v) => v.id === caso.viviendaId) ?? null : null;
  const viviendaMuni = vivienda ? municipios.find((m) => m.id === vivienda.municipioId)?.nombre ?? "" : "";

  const arraigo = calcularArraigo(hogar, caso);
  const pasos = pasosDelCaso(caso, hogar);

  const menoresList = hogar.miembros.filter((m) => m.tipo === "menor");
  const hayMenores = menoresList.length > 0;
  const hayPareja = hogar.miembros.filter((m) => m.tipo === "adulto").length >= 2;

  const faltaEmpleoPareja =
    hayPareja && !caso.hitos.empleoPareja && ["necesario", "en_proceso"].includes(hogar.senales.empleo_pareja);
  const menoresSinMatricular = hayMenores && !caso.hitos.menoresMatriculados;

  const estadoVivienda = !vivienda
    ? "Pendiente"
    : vivienda.estado === "alquilada"
      ? "Estable"
      : "Asignada";

  const estadoSenal = (e: string) =>
    e === "resuelto" ? "Resuelto" : e === "en_proceso" ? "En proceso" : e === "necesario" ? "Necesario" : "No aplica";

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <Link href="/" className="text-sm text-muted hover:text-brand-700">← Volver al tablero</Link>

      {/* A. Cabecera */}
      <Card className="mt-2 mb-6">
        <CardContent className="py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-ink">{hogar.contacto}</h1>
              <p className="mt-1 text-sm text-muted">
                {municipio ? `${municipio.nombre} (${municipio.provincia})` : "Municipio sin asignar"} ·{" "}
                {hogar.tamano} personas · Canal: {ETIQUETA_CANAL[caso.canal]}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <Badge tone={TONO_ESTADO[caso.estado]}>{ETIQUETA_ESTADO[caso.estado]}</Badge>
                <span className="inline-flex items-center">
                  <ArraigoBadge score={arraigo.score} banda={arraigo.banda} />
                  <Hint texto={AYUDA.arraigo} />
                </span>
              </div>
              <div className="text-right text-xs text-muted">
                Próximo paso: <span className="font-medium text-ink">{caso.proximoHito ?? "—"}</span>
                {caso.proximoHitoFecha ? ` · ${formatFecha(caso.proximoHitoFecha)}` : ""}
                <br />
                Técnico: {caso.tecnicoId ? session?.nombre ?? "Asignado" : "Sin asignar"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {caso.estado === "baja" && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <strong>Caso dado de baja.</strong> Motivo: {caso.motivoBaja}. {caso.nota}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Columna izquierda */}
        <div className="space-y-6">
          {/* C. Situación laboral */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Icon name="empleo" size={16} className="text-brand-600" />Situación laboral</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <Dato k="Empleo principal" v={caso.hitos.empleoResuelto ? `Resuelto · ${formatFecha(caso.hitos.empleoResuelto)}` : "Pendiente"} />
              <Dato k="Empresa" v={empresa ? `${empresa.nombre} (${empresa.sector})` : "—"} />
              <Dato k="Vacantes de la empresa" v={empresa ? empresa.vacantes : "—"} />
              <Dato k="Empleo de la pareja" v={hayPareja ? (caso.hitos.empleoPareja ? "Resuelto" : estadoSenal(hogar.senales.empleo_pareja)) : "No aplica"} />
              {faltaEmpleoPareja && <p className="pt-1 text-xs text-[#9c5a4a]">⚠ Falta resolver el empleo de la pareja.</p>}
            </CardContent>
          </Card>

          {/* D. Vivienda */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Icon name="vivienda" size={16} className="text-brand-600" />Vivienda</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <Dato k="Vivienda asignada" v={vivienda ? vivienda.titulo : "Pendiente"} />
              {vivienda && <Dato k="Municipio" v={viviendaMuni} />}
              {vivienda && <Dato k="Precio" v={`${euros(vivienda.precio)}/mes`} />}
              <Dato k="Estado" v={estadoVivienda} />
            </CardContent>
          </Card>

          {/* E. Menores y escolarización */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Icon name="familia" size={16} className="text-brand-600" />Menores y escolarización</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <Dato k="Menores" v={menoresList.length} />
              {hayMenores && (
                <Dato k="Etapas" v={menoresList.map((m) => m.etapaEscolar ?? "—").join(", ")} />
              )}
              <Dato k="Matrícula" v={caso.hitos.menoresMatriculados ? "Matriculados" : hayMenores ? estadoSenal(hogar.senales.escolarizacion) : "No aplica"} />
              {menoresSinMatricular && <p className="pt-1 text-xs text-[#9c5a4a]">⚠ Hay menores sin matricular.</p>}
            </CardContent>
          </Card>

          {/* F. Señales de arraigo */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Icon name="arraigo" size={16} className="text-brand-600" />Señales de arraigo <span className="text-xs font-normal text-muted">({Object.keys(ETIQUETA_SENAL).length})</span></CardTitle></CardHeader>
            <CardContent>
              <SignalsEditor hogarId={hogar.id} casoId={caso.id} senales={hogar.senales} />
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha */}
        <div className="space-y-6">
          {/* I. Próximo paso (acción) */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Icon name="proximo-paso" size={16} className="text-brand-600" />Próximo paso</CardTitle></CardHeader>
            <CardContent>
              <NextStep casoId={caso.id} texto={caso.proximoHito} fecha={caso.proximoHitoFecha} />
            </CardContent>
          </Card>

          {/* I. Hitos (marcar completado) */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Icon name="tarea" size={16} className="text-brand-600" />Hitos del caso</CardTitle></CardHeader>
            <CardContent>
              <HitoChecklist casoId={caso.id} hitos={caso.hitos} hayMenores={hayMenores} hayPareja={hayPareja} />
            </CardContent>
          </Card>

          {/* B. Timeline / pasos */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Icon name="crecimiento" size={16} className="text-brand-600" />Cronología del caso</CardTitle></CardHeader>
            <CardContent><CaseSteps pasos={pasos} /></CardContent>
          </Card>

          {/* I. Empadronamiento */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Icon name="empadronamiento" size={16} className="text-brand-600" />Empadronamiento</CardTitle></CardHeader>
            <CardContent>
              {caso.padron ? (
                <div className="space-y-2 text-sm">
                  <Badge tone="green">Empadronado el {formatFecha(caso.padron.fecha)}</Badge>
                  <Dato k="Personas" v={`${caso.padron.personas} (${caso.padron.menores} menores)`} />
                  {caso.padron.fuente && <Dato k="Fuente" v={caso.padron.fuente} />}
                </div>
              ) : (
                <EmpadronarForm casoId={caso.id} sugeridoPersonas={hogar.tamano} sugeridoMenores={menoresList.length} />
              )}
            </CardContent>
          </Card>

          {/* G. Próximas tareas */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Icon name="tarea" size={16} className="text-brand-600" />Próximas tareas</CardTitle></CardHeader>
            <CardContent>
              <CaseTasks casoId={caso.id} tareas={caso.tareas} />
            </CardContent>
          </Card>

          {/* H. Notas internas */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Icon name="nota" size={16} className="text-brand-600" />Notas internas</CardTitle></CardHeader>
            <CardContent>
              <CaseNotes casoId={caso.id} nota={caso.nota} />
            </CardContent>
          </Card>

          {/* I. Baja */}
          {caso.estado !== "baja" && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Icon name="riesgo" size={16} className="text-[#9c5a4a]" />Zona de riesgo</CardTitle></CardHeader>
              <CardContent>
                <BajaButton casoId={caso.id} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
