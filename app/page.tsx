import Link from "next/link";
import { Button } from "@/components/ui";
import { PageHeader } from "@/components/domain";
import { MiJornada } from "@/components/jornada";
import { AYUDA, Hint } from "@/components/hint";
import { CaseCard, type CaseCardData } from "@/components/case-card";
import { calcularArraigo } from "@/lib/indices";
import { proximosHitos, resumenSemanal, tareasPendientes } from "@/lib/jornada";
import { getRepo } from "@/lib/data";
import { ESTADOS_TABLERO, ETIQUETA_ESTADO, type Hogar } from "@/lib/types";

export const dynamic = "force-dynamic";

function diasDesde(iso?: string | null): number {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

const hoyLargo = () =>
  new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

export default async function WorkspacePage() {
  const repo = getRepo();
  const casosTodos = await repo.getCasos();
  const hogaresList = (await Promise.all(casosTodos.map((c) => repo.getHogar(c.hogarId)))).filter(
    (h): h is Hogar => Boolean(h),
  );
  const hogarPorId = new Map(hogaresList.map((h) => [h.id, h]));

  // Mi jornada (derivado)
  const tareas = tareasPendientes(casosTodos, hogarPorId);
  const proximos = proximosHitos(casosTodos, hogarPorId);
  const resumen = resumenSemanal(casosTodos);

  // Barra "Hoy" — resumen operativo (todo derivado)
  const ahoraMs = Date.now();
  const activos = casosTodos.filter((c) => c.estado !== "baja");
  const tareasActivas = activos.flatMap((c) => c.tareas ?? []);
  const llamadas = tareasActivas.filter((t) => t.tipo === "llamada" && t.estado === "pendiente").length;
  const visitas = tareasActivas.filter((t) => t.tipo === "visita" && t.estado === "pendiente").length;
  const hitosVencidos = activos.filter(
    (c) => c.proximoHitoFecha && new Date(c.proximoHitoFecha).getTime() < ahoraMs,
  ).length;
  const casosEnRiesgo = activos.filter((c) => {
    const h = hogarPorId.get(c.hogarId);
    return h ? calcularArraigo(h, c).score < 40 : false;
  }).length;

  // Tablero
  const casos = casosTodos.filter((c) => c.estado !== "baja");
  const tarjetas: CaseCardData[] = await Promise.all(
    casos.map(async (c) => {
      const hogar = hogarPorId.get(c.hogarId) ?? null;
      const muni = c.municipioDestinoId ? await repo.getMunicipio(c.municipioDestinoId) : null;
      const arraigo = hogar ? calcularArraigo(hogar, c) : { score: 0, banda: "riesgo" as const, factores: [] };

      const alertas: string[] = [];
      if (c.proximoHitoFecha && new Date(c.proximoHitoFecha).getTime() < Date.now()) alertas.push("hito vencido");
      if ((c.estado === "interesado" || c.estado === "acompanamiento") && diasDesde(c.actualizadoAt) > 21)
        alertas.push("estancado");
      const hayMenores = hogar?.miembros.some((m) => m.tipo === "menor") ?? false;
      if (hayMenores && !c.hitos.menoresMatriculados && c.estado !== "interesado") alertas.push("menores sin matricular");
      if (c.retencion.some((r) => !r.completado && new Date(r.vence).getTime() < Date.now()))
        alertas.push("retención pendiente");

      return {
        id: c.id,
        contacto: hogar?.contacto ?? "Hogar",
        municipio: muni?.nombre ?? "Sin asignar",
        tamano: hogar?.tamano ?? 0,
        estado: c.estado,
        arraigoScore: arraigo.score,
        arraigoBanda: arraigo.banda,
        proximoHito: c.proximoHito,
        proximoHitoFecha: c.proximoHitoFecha,
        alertas,
      };
    }),
  );

  return (
    <div className="flex h-full flex-col px-8 py-8">
      <PageHeader
        title="Mi jornada"
        subtitle={hoyLargo()}
        action={
          <div className="flex gap-2">
            <Link href="/dashboard">
              <Button variant="outline">Panel de impacto</Button>
            </Link>
            <Link href="/casos/nuevo">
              <Button>＋ Nuevo caso</Button>
            </Link>
          </div>
        }
      />

      <div className="mb-4 rounded-xl border border-[#e3e7e3] bg-white px-4 py-2.5 text-sm">
        <span className="font-semibold text-ink">Hoy:</span>{" "}
        <span className="text-muted">
          {llamadas} {llamadas === 1 ? "llamada pendiente" : "llamadas pendientes"} ·{" "}
          {visitas} {visitas === 1 ? "visita programada" : "visitas programadas"} ·{" "}
          {casosEnRiesgo} {casosEnRiesgo === 1 ? "caso en riesgo" : "casos en riesgo"} ·{" "}
          {hitosVencidos} {hitosVencidos === 1 ? "hito vencido" : "hitos vencidos"}
        </span>
      </div>

      <MiJornada tareas={tareas} proximos={proximos} resumen={resumen} />

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
        Tablero de casos
        <Hint texto={AYUDA.arraigo} />
      </h2>
      <div className="board-scroll flex flex-1 gap-4 overflow-x-auto pb-4">
        {ESTADOS_TABLERO.map((estado) => {
          const items = tarjetas.filter((t) => t.estado === estado);
          return (
            <div key={estado} className="flex w-72 shrink-0 flex-col rounded-xl bg-gray-50/70 p-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">{ETIQUETA_ESTADO[estado]}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-muted">{items.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {items.map((t) => (
                  <CaseCard key={t.id} data={t} />
                ))}
                {items.length === 0 && (
                  <div className="rounded-lg border border-dashed border-gray-200 py-6 text-center text-xs text-muted">
                    Sin casos
                  </div>
                )}
              </div>
              {(estado === "instalado" || estado === "asentado") && (
                <p className="mt-3 text-[10px] leading-snug text-muted">
                  Columna automática: se alcanza con el empadronamiento{estado === "asentado" ? " (≥12 meses)" : ""}.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
