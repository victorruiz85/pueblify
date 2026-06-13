"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { logoutAction } from "@/lib/auth-actions";
import { PueblifyMark } from "@/components/logo";
import { Icon, type IconName } from "@/components/Icon";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Mi jornada · Tablero", icon: "caso" },
  { href: "/dashboard", label: "Panel de impacto", icon: "impacto" },
  { href: "/casos/nuevo", label: "Nuevo caso", icon: "hogar" },
];

export function Sidebar({
  session,
  demo = false,
}: {
  session: { nombre: string; rol: string };
  demo?: boolean;
}) {
  const path = usePathname();
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-[#e3e7e3] bg-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
          <PueblifyMark className="h-5 w-5" />
        </div>
        <div>
          <div className="text-base font-bold leading-none text-ink">Pueblify</div>
          <div className="text-[11px] text-muted">Atracción de población</div>
        </div>
      </div>
      <nav className="flex flex-col gap-1 px-3 py-2">
        {NAV.map((item) => {
          const active = item.href === "/" ? path === "/" : path.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-brand-50 text-brand-700" : "text-muted hover:bg-gray-50 hover:text-ink",
              )}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-3 py-4">
        {demo && (
          <div className="mb-2 rounded-lg bg-brand-50 px-3 py-2 text-[11px] font-medium leading-snug text-brand-700">
            ● Modo demo · datos en memoria
          </div>
        )}
        <div className="mb-2 rounded-lg bg-earth-100 px-3 py-2 text-[11px] leading-snug text-[#7a6536]">
          <strong>Piloto:</strong> GAL Zona Media · Comarca de Sangüesa
        </div>
        <div className="flex items-center justify-between rounded-lg border border-[#e3e7e3] px-3 py-2">
          <div className="min-w-0">
            <div className="truncate text-xs font-medium text-ink">{session.nombre}</div>
            <div className="text-[10px] capitalize text-muted">{session.rol}</div>
          </div>
          <form action={logoutAction}>
            <button className="text-[11px] text-muted hover:text-brand-700" type="submit">
              Salir
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
