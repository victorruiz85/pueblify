import { redirect } from "next/navigation";

// El tablero es ahora la pantalla principal ("/"). Mantener /casos como alias.
export default function CasosRedirect() {
  redirect("/");
}
