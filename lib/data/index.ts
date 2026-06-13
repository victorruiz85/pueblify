// Selector de repositorio: Supabase si hay variables de entorno; si no, en memoria.
import { MemoryRepo } from "./memory";
import { SupabaseRepo } from "./supabase";
import type { Repo } from "./repo";

export type { Repo, NuevoHogarInput } from "./repo";

let instancia: Repo | null = null;

export function getRepo(): Repo {
  if (!instancia) {
    instancia = process.env.NEXT_PUBLIC_SUPABASE_URL ? new SupabaseRepo() : new MemoryRepo();
  }
  return instancia;
}
