// Clientes de Supabase para uso EN SERVIDOR.
//
// Hay dos, con propósitos distintos (ver supabase/ACCESO_Y_RLS.md):
//
//  • supabaseService(): usa SUPABASE_SERVICE_ROLE_KEY. Omite RLS. Solo servidor.
//    Para operaciones de confianza sobre datos operativos/personales (casos, hogares,
//    padrón, escrituras). Nunca debe llegar al navegador.
//
//  • supabaseAnon(): usa NEXT_PUBLIC_SUPABASE_ANON_KEY. Respeta RLS.
//    Para lecturas de catálogo público (municipios, empresas).
//
// Si falta una clave, se cae a la otra de forma degradada (se avisa por consola).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let serviceClient: SupabaseClient | null = null;
let anonClient: SupabaseClient | null = null;

function url(): string {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!u) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL.");
  return u;
}

export function supabaseService(): SupabaseClient {
  if (serviceClient) return serviceClient;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("[supabase] SUPABASE_SERVICE_ROLE_KEY ausente: usando anon (acceso limitado por RLS).");
  }
  if (!key) throw new Error("Falta la clave de Supabase (service role o anon).");
  serviceClient = createClient(url(), key, { auth: { persistSession: false } });
  return serviceClient;
}

export function supabaseAnon(): SupabaseClient {
  if (anonClient) return anonClient;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Falta NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  anonClient = createClient(url(), key, { auth: { persistSession: false } });
  return anonClient;
}
