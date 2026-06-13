import { Card, CardContent } from "@/components/ui";
import { LoginForm } from "@/components/login-form";
import { PueblifyMark } from "@/components/logo";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f9f7] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-white">
            <PueblifyMark className="h-6 w-6" />
          </div>
          <div>
            <div className="text-lg font-bold text-ink">Pueblify</div>
            <div className="text-xs text-muted">Acceso de técnicos y administración</div>
          </div>
        </div>
        <Card>
          <CardContent className="py-6">
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
