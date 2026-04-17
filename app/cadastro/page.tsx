import { Suspense } from "react";
import { CadastroAvaliadorForm } from "./cadastro-form";

export const dynamic = "force-dynamic";

export default function CadastroPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Carregando…</div>}>
      <CadastroAvaliadorForm />
    </Suspense>
  );
}
