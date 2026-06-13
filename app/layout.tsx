import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Pueblify · Atracción de población",
  description:
    "Herramienta de los técnicos de desarrollo rural y panel de impacto. Convierte empleo y vivienda en habitantes empadronados.",
};

// Toda la app se sirve por petición (lee cookies/sesión y datos del repositorio).
// Forzar dinámico evita que el build intente prerenderizar páginas con datos, que es
// la causa típica de que `next build` se quede en "Collecting page data".
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  // Modo demo = sin Supabase configurado (almacén en memoria).
  const demo = !process.env.NEXT_PUBLIC_SUPABASE_URL;
  return (
    <html lang="es">
      <body>
        {session ? (
          <div className="flex h-screen overflow-hidden">
            <Sidebar session={session} demo={demo} />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
