import { createServerSupabase } from "@/lib/supabase/server";
import { RankingClient } from "./ranking-client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getStatusLabel } from "@/lib/utils/status";
import { Badge } from "@/components/ui/badge";

function statusBadgeClass(status: string) {
  switch (status) {
    case "SELECIONADO":
      return "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:border-emerald-300/40 dark:bg-emerald-300/15 dark:text-emerald-200";
    case "SUPLENTE":
      return "border-violet-500/35 bg-violet-500/10 text-violet-700 dark:border-violet-300/40 dark:bg-violet-300/15 dark:text-violet-200";
    case "NAO_SELECIONADO":
      return "border-muted-foreground/30 bg-muted/40 text-foreground dark:border-muted-foreground/40 dark:bg-muted/30 dark:text-foreground";
    default:
      return "border-muted-foreground/30 bg-muted/40 text-foreground dark:border-muted-foreground/40 dark:bg-muted/30 dark:text-foreground";
  }
}

export default async function RankingPage() {
  const supabase = await createServerSupabase();
  const { data: cfg } = await supabase.from("app_config").select("*").eq("id", 1).single();
  const { data: rows } = await supabase
    .from("resultados")
    .select("*, projetos(*)")
    .order("posicao_geral", { ascending: true, nullsFirst: false });

  const projetoIds = (rows ?? []).map((r) => r.projeto_id).filter(Boolean);
  const statsByProjetoId = new Map<string, { qtdNotas: number; cvPct: number | null }>();

  if (projetoIds.length > 0) {
    const { data: atribs } = await supabase
      .from("atribuicoes")
      .select("id, projeto_id, status")
      .in("projeto_id", projetoIds);

    const concluidas = (atribs ?? []).filter((a) => a.status === "CONCLUIDA");
    const atribuicaoIds = concluidas.map((a) => a.id);
    const atribuicaoToProjeto = new Map<string, string>();
    for (const a of concluidas) atribuicaoToProjeto.set(a.id, a.projeto_id);

    if (atribuicaoIds.length > 0) {
      const { data: avs } = await supabase
        .from("avaliacoes")
        .select("atribuicao_id, nota_total_ponderada")
        .in("atribuicao_id", atribuicaoIds);

      const totalsByProjeto = new Map<string, number[]>();
      for (const av of avs ?? []) {
        const pid = atribuicaoToProjeto.get(av.atribuicao_id);
        if (!pid) continue;
        const arr = totalsByProjeto.get(pid) ?? [];
        arr.push(Number(av.nota_total_ponderada));
        totalsByProjeto.set(pid, arr);
      }

      for (const pid of projetoIds) {
        const totals = totalsByProjeto.get(pid) ?? [];
        if (totals.length === 0) {
          statsByProjetoId.set(pid, { qtdNotas: 0, cvPct: null });
          continue;
        }
        if (totals.length === 1) {
          statsByProjetoId.set(pid, { qtdNotas: 1, cvPct: 0 });
          continue;
        }

        const max = Math.max(...totals);
        const min = Math.min(...totals);
        const media = totals.reduce((s, v) => s + v, 0) / totals.length;
        const cvPct = media === 0 ? 0 : ((max - min) / media) * 100;
        statsByProjetoId.set(pid, { qtdNotas: totals.length, cvPct });
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Ranking</h1>
        <p className="text-sm text-muted-foreground">Gere o ranking numérico, defina vagas e aplique a cota do Sertão.</p>
      </div>
      <RankingClient totalVagasInicial={cfg?.total_vagas ?? 25} />
      <div className="rounded-xl border border-border/70 bg-card/85 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pos.</TableHead>
              <TableHead>Projeto</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Município</TableHead>
              <TableHead className="text-right">Notas</TableHead>
              <TableHead className="text-right">Dif. %</TableHead>
              <TableHead>Nota final</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cota</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(rows ?? []).map((r) => {
              const p = r.projetos as { nome_projeto: string; nome_responsavel: string; municipio: string };
              const stats = statsByProjetoId.get(r.projeto_id) ?? { qtdNotas: 0, cvPct: null };
              return (
                <TableRow key={r.id}>
                  <TableCell>{r.posicao_geral ?? "—"}</TableCell>
                  <TableCell className="font-medium">{p?.nome_projeto}</TableCell>
                  <TableCell>{p?.nome_responsavel}</TableCell>
                  <TableCell>{p?.municipio}</TableCell>
                  <TableCell className="text-right tabular-nums">{stats.qtdNotas || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{stats.cvPct === null ? "—" : stats.cvPct.toFixed(2)}</TableCell>
                  <TableCell>{Number(r.nota_final).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`whitespace-nowrap ${statusBadgeClass(String(r.status_final ?? ""))}`}
                    >
                      {getStatusLabel(r.status_final)}
                    </Badge>
                  </TableCell>
                  <TableCell>{r.enquadramento_cota ? "Sim" : "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
