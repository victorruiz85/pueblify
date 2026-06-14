import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { PageHeader } from "@/components/domain";
import { Icon } from "@/components/Icon";
import { NewEmpresaForm } from "@/components/new-empresa-form";
import { getRepo } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function EmpresasPage() {
  const repo = getRepo();
  const [empresas, municipios, oficiales] = await Promise.all([
    repo.getEmpresas(),
    repo.getMunicipios(),
    repo.getMunicipiosOficiales(),
  ]);
  const muniName = (id: string) => municipios.find((m) => m.id === id)?.nombre ?? "—";

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <PageHeader
        title="Empresas"
        subtitle="Empresas de la comarca que ofrecen empleo. Aparecerán al crear un caso."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="empresa" size={16} className="text-brand-600" />Empresas ({empresas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {empresas.length === 0 ? (
              <p className="text-sm text-muted">Aún no hay empresas. Crea la primera a la derecha.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {empresas.map((e) => (
                  <li key={e.id} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">
                    <span className="min-w-0">
                      <b className="text-ink">{e.nombre}</b>
                      <div className="text-xs text-muted">
                        {muniName(e.municipioId)}{e.cp ? ` · ${e.cp}` : ""}{e.sector ? ` · ${e.sector}` : ""}
                      </div>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {e.esTractora && <Badge tone="green">Tractora</Badge>}
                      <span className="text-xs text-muted">{e.vacantes} vac.</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Añadir empresa</CardTitle></CardHeader>
          <CardContent>
            <NewEmpresaForm municipios={oficiales} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
