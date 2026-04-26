import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardMetricasClient } from "./dashboard-metricas-client";
import { AlertTriangle, BarChart3, CheckCircle2, Clock3, FileText, UserRoundCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const { data: avaliadores } = await supabase.from("avaliadores").select("id, nome");

  const pendPorAval = new Map<string, number>();
  for (const p of pends ?? []) {
    pendPorAval.set(p.avaliador_id, (pendPorAval.get(p.avaliador_id) ?? 0) + 1);
  }
  const nomePorAvaliador = new Map((avaliadores ?? []).map((a) => [a.id, a.nome]));

  const eleg = Math.max(0, (total ?? 0) - (desc ?? 0));
  const pct = eleg > 0 ? Math.round(((aval ?? 0) / eleg) * 100) : 0;
  const { data: projetos } = await supabase.from("projetos").select("id, municipio, fase, status, timestamp_submissao");
  const { data: avaliacoes } = await supabase.from("avaliacoes").select("data_avaliacao, atribuicoes(projeto_id)");

  const firstAvaliacaoByProjeto = new Map<string, Date>();
  for (const a of avaliacoes ?? []) {
    const projetoId = (a.atribuicoes as { projeto_id?: string } | null)?.projeto_id;
    if (!projetoId) continue;
    const current = firstAvaliacaoByProjeto.get(projetoId);
    const d = new Date(a.data_avaliacao);
    if (!current || d < current) firstAvaliacaoByProjeto.set(projetoId, d);
  }

  const projetosComMetrica = (projetos ?? []).map((p) => ({
    id: p.id,
    municipio: p.municipio,
    fase: p.fase,
    status: p.status,
    timestamp_submissao: p.timestamp_submissao,
    first_eval_at: firstAvaliacaoByProjeto.get(p.id)?.toISOString() ?? null,
  }));
  const maxPend = Math.max(1, ...Array.from(pendPorAval.values()));

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/70 bg-gradient-to-r from-card/90 via-card/80 to-primary/5 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Monitoramento</h1>
            <p className="text-sm text-muted-foreground">Visão executiva da operação de avaliação</p>
          </div>
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/manual">Abrir manual da plataforma</Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/70 bg-card/85 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inscritos</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-bold">{total ?? 0}</p>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/85 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Desclassificados</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-bold text-rose-600">{desc ?? 0}</p>
            <AlertTriangle className="h-5 w-5 text-rose-500" />
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/85 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avaliados</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-bold text-emerald-600">{aval ?? 0}</p>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/85 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em avaliação</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-bold text-amber-600">{em ?? 0}</p>
            <Clock3 className="h-5 w-5 text-amber-500" />
          </CardContent>
        </Card>
      </div>
      <DashboardMetricasClient projetos={projetosComMetrica} progressoPct={pct} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 bg-card/85 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRoundCheck className="h-4 w-4 text-amber-500" />
              Aguardando 3º avaliador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-bold">{ag3 ?? 0}</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-amber-500 transition-all" style={{ width: `${Math.min(100, ((ag3 ?? 0) / Math.max(1, total ?? 1)) * 100)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">Proporção sobre total de projetos cadastrados.</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/85 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-rose-500" />
              Avaliadores com pendências
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from(pendPorAval.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([id, n]) => {
                return (
                  <div key={id} className="rounded-lg border border-border/60 p-2">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{nomePorAvaliador.get(id) ?? "Avaliador não encontrado"}</span>
                      <span className="text-muted-foreground">{n} pendência(s)</span>
                    </div>
                    <div className="h-2 rounded bg-muted">
                      <div className="h-2 rounded bg-rose-500" style={{ width: `${(n / maxPend) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            {pendPorAval.size === 0 && <p className="text-sm text-muted-foreground">Nenhuma pendência registrada.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
