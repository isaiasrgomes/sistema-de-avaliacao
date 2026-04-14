import { createServerSupabase } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabase();

  const { count: total } = await supabase.from("projetos").select("*", { count: "exact", head: true });
  const { count: desc } = await supabase
    .from("projetos")
    .select("*", { count: "exact", head: true })
    .eq("status", "DESCLASSIFICADO");
  const { count: aval } = await supabase.from("projetos").select("*", { count: "exact", head: true }).eq("status", "AVALIADO");
  const { count: em } = await supabase
    .from("projetos")
    .select("*", { count: "exact", head: true })
    .eq("status", "EM_AVALIACAO");
  const { count: ag3 } = await supabase
    .from("projetos")
    .select("*", { count: "exact", head: true })
    .eq("status", "AGUARDANDO_3O_AVALIADOR");

  const { data: pends } = await supabase
    .from("atribuicoes")
    .select("avaliador_id")
    .in("status", ["PENDENTE", "EM_ANDAMENTO"]);

  const pendPorAval = new Map<string, number>();
  for (const p of pends ?? []) {
    pendPorAval.set(p.avaliador_id, (pendPorAval.get(p.avaliador_id) ?? 0) + 1);
  }

  const eleg = Math.max(0, (total ?? 0) - (desc ?? 0));
  const pct = eleg > 0 ? Math.round(((aval ?? 0) / eleg) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Monitoramento</h1>
        <p className="text-sm text-muted-foreground">Indicadores gerais da avaliação</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/70 bg-card/85 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inscritos</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{total ?? 0}</CardContent>
        </Card>
        <Card className="border-border/70 bg-card/85 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Desclassificados</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{desc ?? 0}</CardContent>
        </Card>
        <Card className="border-border/70 bg-card/85 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avaliados</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{aval ?? 0}</CardContent>
        </Card>
        <Card className="border-border/70 bg-card/85 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em avaliação</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{em ?? 0}</CardContent>
        </Card>
      </div>
      <Card className="border-border/70 bg-card/85 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Progresso estimado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {pct}% dos elegíveis com ciclo encerrado (aproximação por status “Avaliado”).
          </p>
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 bg-card/85 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Aguardando 3º avaliador</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{ag3 ?? 0}</CardContent>
        </Card>
        <Card className="border-border/70 bg-card/85 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Avaliadores com pendências</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground">
              {Array.from(pendPorAval.entries())
                .slice(0, 8)
                .map(([id, n]) => (
                <li key={id}>
                  {id.slice(0, 8)}… — {n} pendência(s)
                </li>
              ))}
              {pendPorAval.size === 0 && <li>Nenhuma pendência registrada.</li>}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
