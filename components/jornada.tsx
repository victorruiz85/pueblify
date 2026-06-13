import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { formatFecha } from "@/lib/format";
import type { ProximoHito, ResumenSemanal, Tarea } from "@/lib/jornada";

export function MiJornada({
  tareas,
  proximos,
  resumen,
}: {
  tareas: Tarea[];
  proximos: ProximoHito[];
  resumen: ResumenSemanal;
}) {
  return (
    <div className="mb-6 grid gap-4 lg:grid-cols-3">
      {/* Tareas pendientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Icon name="tarea" size={16} className="text-brand-600" />Tareas pendientes {tareas.length > 0 && <span className="text-muted">· {tareas.length}</span>}</CardTitle>
        </CardHeader>
        <CardContent>
          {tareas.length === 0 ? (
            <p className="text-sm text-muted">Nada urgente. Buen trabajo.</p>
          ) : (
            <ul className="space-y-2">
              {tareas.slice(0, 6).map((t, i) => (
                <li key={i}>
                  <Link href={`/casos/${t.casoId}`} className="flex items-start gap-2 text-sm hover:text-brand-700">
                    <span className={"mt-1.5 h-2 w-2 shrink-0 rounded-full " + (t.urgencia === "alta" ? "bg-red-500" : "bg-amber-500")} />
                    <span>
                      <span className="font-medium text-ink">{t.contacto}</span>
                      <span className="text-muted"> · {t.etiqueta}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Próximos hitos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Icon name="proximo-paso" size={16} className="text-brand-600" />Próximos pasos (14 días)</CardTitle>
        </CardHeader>
        <CardContent>
          {proximos.length === 0 ? (
            <p className="text-sm text-muted">Sin hitos próximos.</p>
          ) : (
            <ul className="space-y-2">
              {proximos.slice(0, 6).map((p, i) => (
                <li key={i}>
                  <Link href={`/casos/${p.casoId}`} className="flex items-center justify-between gap-2 text-sm hover:text-brand-700">
                    <span className="min-w-0 truncate">
                      <span className="font-medium text-ink">{p.contacto}</span>
                      <span className="text-muted"> · {p.hito}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted">{formatFecha(p.fecha)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Resumen semanal de impacto */}
      <Card className="border-brand-200 bg-brand-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Icon name="impacto" size={16} className="text-brand-600" />Resumen semanal de impacto</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5 text-sm">
            <Fila etiqueta="Hogares nuevos" valor={resumen.nuevos} />
            <Fila etiqueta="Empadronamientos" valor={resumen.empadronamientos} />
            <Fila etiqueta="Personas fijadas" valor={resumen.personasFijadas} />
            <Fila etiqueta="Hitos completados" valor={resumen.hitosCompletados} />
            <Fila etiqueta="Bajas" valor={resumen.bajas} />
          </ul>
          <p className="mt-2 text-[11px] text-muted">Últimos 7 días.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-muted">{etiqueta}</span>
      <span className="font-semibold text-ink tabular-nums">{valor}</span>
    </li>
  );
}
