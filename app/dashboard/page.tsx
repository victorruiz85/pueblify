import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { Funnel, PageHeader, PueblifyGauge, StatCard } from "@/components/domain";
import { InfoHelp } from "@/components/help";
import { AYUDA, Hint } from "@/components/hint";
import { Icon } from "@/components/Icon";
import { calcularPueblify } from "@/lib/indices";
import { calcularRetencion } from "@/lib/retention";
import { getRepo } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const repo = getRepo();
  const [casos, viviendas, empresas, municipios] = await Promise.all([
    repo.getCasos(),
    repo.getViviendas(),
    repo.getEmpresas(),
    repo.getMunicipios(),
  ]);
  const hogares = (await Promise.all(casos.map((c) => repo.getHogar(c.hogarId)))).filter(
    (h): h is NonNullable<typeof h> => Boolean(h),
  );

  const datos = { casos, hogares, viviendas, empresas };

  const empadronados = casos.filter((c) => c.padron && c.estado !== "baja");
  const bajas = casos.filter((c) => c.estado === "baja");
  const habitantesFijados =
    empadronados.reduce((s, c) => s + (c.padron?.personas ?? 0), 0) -
    bajas.filter((c) => c.padron).reduce((s, c) => s + (c.padron?.personas ?? 0), 0);
  const menores = empadronados.reduce((s, c) => s + (c.padron?.menores ?? 0), 0);
  const hogaresReubicados = empadronados.length;

  const ret = calcularRetencion(casos);

  const empleosCubiertos = casos.filter((c) => c.hitos.empleoResuelto && c.estado !== "baja").length;
  const viviendasActivadas = viviendas.filter(
    (v) => v.estado === "publicada" || v.estado === "reservada" || v.estado === "alquilada",
  ).length;

  const noBaja = casos.filter((c) => c.estado !== "baja");
  const f0 = noBaja.length;
  const fAcomp = noBaja.filter((c) => c.estado !== "interesado").length;
  const fEmparejado = noBaja.filter((c) => c.hitos.viviendaAsignada && c.hitos.empleoResuelto).length;
  const fTraslado = noBaja.filter((c) => c.hitos.mudanza).length;
  const fEmpadronado = noBaja.filter((c) => c.hitos.empadronado).length;
  const fAsentado = noBaja.filter((c) => c.estado === "asentado").length;
  const pct = (n: number) => (f0 ? Math.round((n / f0) * 100) : 0);
  const etapas = [
    { label: "Interés", valor: f0, pct: 100 },
    { label: "En acompañamiento", valor: fAcomp, pct: pct(fAcomp) },
    { label: "Emparejado (viv.+empleo)", valor: fEmparejado, pct: pct(fEmparejado) },
    { label: "Traslado", valor: fTraslado, pct: pct(fTraslado) },
    { label: "Empadronado", valor: fEmpadronado, pct: pct(fEmpadronado) },
    { label: "Asentado", valor: fAsentado, pct: pct(fAsentado) },
  ];

  const motivos = bajas.reduce<Record<string, number>>((acc, c) => {
    const m = c.motivoBaja ?? "otro";
    acc[m] = (acc[m] ?? 0) + 1;
    return acc;
  }, {});

  const resultadosMuni = municipios.map((m) => ({ m, r: calcularPueblify(m, datos) }));

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <PageHeader
        title="Panel de impacto"
        subtitle="Vista de dirección y reporting · comarca de Sangüesa"
        action={
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline">← Volver al tablero</Button>
            </Link>
            <Link href="/casos/nuevo">
              <Button>＋ Nuevo caso</Button>
            </Link>
          </div>
        }
      />

      <InfoHelp />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label={<>Habitantes fijados<Hint texto={AYUDA.habitantesFijados} /></>} value={habitantesFijados} hint="Empadronados vía Pueblify (netos)" tone="green" />
        <StatCard label="Hogares reubicados" value={hogaresReubicados} hint="Unidades de convivencia instaladas" />
        <StatCard label="Menores incorporados" value={menores} hint="Impacto en matrícula escolar" />
        <StatCard
          label={<>Retención 12m<Hint texto={AYUDA.asentado} /></>}
          value={ret.tasa === null ? "—" : `${ret.tasa}%`}
          hint={ret.tasa === null ? "Aún sin elegibles" : `${ret.retenidos}/${ret.elegibles} elegibles`}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Casos activos" value={noBaja.length} />
        <StatCard label="Empleos cubiertos" value={empleosCubiertos} />
        <StatCard label="Viviendas activadas" value={viviendasActivadas} />
        <StatCard label="Bajas" value={bajas.length} hint="Hogares que se marcharon" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Icon name="crecimiento" size={16} className="text-brand-600" />Embudo de atracción de población</CardTitle></CardHeader>
          <CardContent><Funnel etapas={etapas} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Icon name="indice-pueblify" size={16} className="text-brand-600" />Índice Pueblify por municipio</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {resultadosMuni.map(({ m, r }) => (
              <PueblifyGauge key={m.id} resultado={r} nombre={`${m.nombre} (${m.provincia})`} />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Icon name="familia" size={16} className="text-brand-600" />Impacto escolar (brecha hasta el umbral)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {municipios.map((m) => {
              const brecha = m.umbralEscolar - m.matriculaEscolar;
              return (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <span className="text-ink">{m.nombre}</span>
                  <span className="text-muted">
                    Matrícula {m.matriculaEscolar} / umbral {m.umbralEscolar}{" "}
                    {brecha > 0 ? <Badge tone="red">faltan {brecha}</Badge> : <Badge tone="green">escuela viable</Badge>}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Icon name="riesgo" size={16} className="text-[#9c5a4a]" />Diagnóstico de fuga (motivos de baja)</CardTitle></CardHeader>
          <CardContent>
            {Object.keys(motivos).length === 0 ? (
              <p className="text-sm text-muted">Sin bajas registradas.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {Object.entries(motivos).map(([motivo, n]) => (
                  <li key={motivo} className="flex items-center justify-between">
                    <span className="capitalize text-ink">{motivo.replace("_", " ")}</span>
                    <Badge tone="earth">{n}</Badge>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-muted">
              Si predomina &quot;servicios&quot; o &quot;vínculos sociales&quot;, el problema no es la vivienda: es el arraigo.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
