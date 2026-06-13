import Link from "next/link";
import { PageHeader } from "@/components/domain";
import { NewHouseholdForm } from "@/components/new-household-form";
import { getRepo } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function NuevoHogarPage() {
  const repo = getRepo();
  const [muniRaw, empRaw] = await Promise.all([repo.getMunicipios(), repo.getEmpresas()]);
  const municipios = muniRaw.map((m) => ({ id: m.id, nombre: m.nombre }));
  const empresas = empRaw.map((e) => ({ id: e.id, nombre: e.nombre }));

  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      <Link href="/" className="text-sm text-muted hover:text-brand-700">← Volver al tablero</Link>
      <div className="mt-2">
        <PageHeader
          title="Nuevo caso"
          subtitle="Alta rápida del hogar: solo lo imprescindible. El caso se abre en «Interesado» y se trabaja desde el tablero."
        />
      </div>
      <NewHouseholdForm municipios={municipios} empresas={empresas} />
    </div>
  );
}
