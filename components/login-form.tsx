"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/auth-actions";
import { Button, Input, Label } from "@/components/ui";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, null as null | { ok: boolean; error?: string });
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label>Usuario</Label>
        <Input name="usuario" placeholder="admin o tecnico" autoComplete="username" />
      </div>
      <div>
        <Label>Contraseña</Label>
        <Input name="password" type="password" autoComplete="current-password" />
      </div>
      {state && !state.ok && state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Entrando…" : "Entrar"}
      </Button>
      <p className="text-center text-xs text-muted">
        Demo: <code>admin</code> / <code>tecnico</code> · contraseña <code>pueblify</code>
      </p>
    </form>
  );
}
