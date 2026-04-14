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

  const metricsPorMunicipio = new Map<string, { total: number; ideacao: number; validacao: number; avaliados: number }>();
  for (const p of projetos ?? []) {
    const item = metricsPorMunicipio.get(p.municipio) ?? { total: 0, ideacao: 0, validacao: 0, avaliados: 0 };
    item.total += 1;
    if (p.fase === "IDEACAO") item.ideacao += 1;
    if (p.fase === "VALIDACAO") item.validacao += 1;
    if (p.status === "AVALIADO" || p.status === "SELECIONADO" || p.status === "SUPLENTE" || p.status === "NAO_SELECIONADO") {
      item.avaliados += 1;
    }
    metricsPorMunicipio.set(p.municipio, item);
  }

  const topMunicipios = Array.from(metricsPorMunicipio.entries())
    .map(([municipio, m]) => ({ municipio, ...m, taxaAvaliacao: m.total ? Math.round((m.avaliados / m.total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const firstAvaliacaoByProjeto = new Map<string, Date>();
  for (const a of avaliacoes ?? []) {
    const projetoId = (a.atribuicoes as { projeto_id?: string } | null)?.projeto_id;
    if (!projetoId) continue;
    const current = firstAvaliacaoByProjeto.get(projetoId);
    const d = new Date(a.data_avaliacao);
    if (!current || d < current) firstAvaliacaoByProjeto.set(projetoId, d);
  }

  let somaHoras = 0;
  let qtdTempo = 0;
  for (const p of projetos ?? []) {
    const fim = firstAvaliacaoByProjeto.get(p.id);
    if (!fim) continue;
    const ini = new Date(p.timestamp_submissao);
    const horas = (fim.getTime() - ini.getTime()) / (1000 * 60 * 60);
    if (horas >= 0) {
      somaHoras += horas;
      qtdTempo += 1;
    }
  }
  const tempoMedioHoras = qtdTempo ? (somaHoras / qtdTempo).toFixed(1) : "0.0";

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/70 bg-card/85 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top municípios</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{topMunicipios[0]?.municipio ?? "Sem dados"}</CardContent>
        </Card>
        <Card className="border-border/70 bg-card/85 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de avaliação</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{pct}%</CardContent>
        </Card>
        <Card className="border-border/70 bg-card/85 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tempo médio por projeto</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{tempoMedioHoras}h</CardContent>
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
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([id, n]) => (
                <li key={id}>
                  {nomePorAvaliador.get(id) ?? "Avaliador não encontrado"} — {n} pendência(s)
                </li>
              ))}
              {pendPorAval.size === 0 && <li>Nenhuma pendência registrada.</li>}
            </ul>
          </CardContent>
        </Card>
      </div>
      <Card className="border-border/70 bg-card/85 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Métricas por município e fase</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {topMunicipios.map((m) => (
              <li key={m.municipio}>
                {m.municipio} — Total: {m.total} | Ideação: {m.ideacao} | Validação: {m.validacao} | Taxa avaliada:{" "}
                {m.taxaAvaliacao}%
              </li>
            ))}
            {topMunicipios.length === 0 && <li>Nenhum projeto cadastrado ainda.</li>}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
