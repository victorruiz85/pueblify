// Autenticación mínima (admin / técnico) basada en cookie de sesión.
// Es deliberadamente simple para el MVP; en producción se sustituye por Supabase Auth.

import { cookies } from "next/headers";

export const SESSION_COOKIE = "pueblify_session";

export type Rol = "administrador" | "tecnico";

export interface Session {
  usuario: string;
  rol: Rol;
  nombre: string;
  // UUID del registro en profiles (Supabase). Con Supabase Auth vendría de auth.uid();
  // aquí se mapea por variable de entorno al iniciar sesión.
  profileId?: string | null;
}

interface Cuenta {
  password: string;
  rol: Rol;
  nombre: string;
  profileId?: string | null;
}

// Cuentas demo (configurables por variables de entorno).
const CUENTAS: Record<string, Cuenta> = {
  admin: {
    password: process.env.PUEBLIFY_ADMIN_PASSWORD ?? "pueblify",
    rol: "administrador",
    nombre: "Administrador",
    profileId: process.env.PUEBLIFY_ADMIN_PROFILE_ID ?? null,
  },
  tecnico: {
    password: process.env.PUEBLIFY_TECNICO_PASSWORD ?? "pueblify",
    rol: "tecnico",
    nombre: "Marta Iribarren",
    profileId: process.env.PUEBLIFY_TECNICO_PROFILE_ID ?? null,
  },
};

export function validarCredenciales(usuario: string, password: string): Session | null {
  const clave = (usuario ?? "").trim().toLowerCase();
  const cuenta = CUENTAS[clave];
  if (!cuenta || cuenta.password !== password) return null;
  return { usuario: clave, rol: cuenta.rol, nombre: cuenta.nombre, profileId: cuenta.profileId };
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as Session;
  } catch {
    return null;
  }
}
