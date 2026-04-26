import { ManualView } from "@/components/manual-view";

export default function AvaliadorManualPage() {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Manual do Avaliador</h1>
        <p className="text-sm text-muted-foreground">
          Guia da área do avaliador com orientações de uso e boas práticas de avaliação.
        </p>
      </div>
      <ManualView perfil="avaliador" />
    </div>
  );
}
