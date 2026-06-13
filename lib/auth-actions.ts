"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, validarCredenciales } from "./auth";

export async function loginAction(_prev: unknown, formData: FormData) {
  const usuario = String(formData.get("usuario") ?? "");
  const password = String(formData.get("password") ?? "");
  const sesion = validarCredenciales(usuario, password);
  if (!sesion) {
    return { ok: false as const, error: "Usuario o contraseña incorrectos." };
  }
  const store = await cookies();
  store.set(SESSION_COOKIE, encodeURIComponent(JSON.stringify(sesion)), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  redirect("/");
}

export async function logoutAction() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
