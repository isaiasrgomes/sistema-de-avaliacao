import { ManualView } from "@/components/manual-view";

export default function AdminManualPage() {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Manual da Coordenação</h1>
        <p className="text-sm text-muted-foreground">
          Instruções operacionais do painel administrativo com passo a passo das rotinas principais.
        </p>
      </div>
      <ManualView perfil="admin" />
    </div>
  );
}
