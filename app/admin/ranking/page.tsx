import { createServerSupabase } from "@/lib/supabase/server";
import { RankingClient } from "./ranking-client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getStatusLabel } from "@/lib/utils/status";
import { Badge } from "@/components/ui/badge";
import { mediaNotasTotaisProjeto, qtdNotasEDispersaoParPrincipal } from "@/lib/services/nota";

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
  const statsByProjetoId = new Map<string, { qtdNotas: number; cvPct: number | null; mediaNotaFinal: number | null }>();

  if (projetoIds.length > 0) {
    const { data: atribs } = await supabase
      .from("atribuicoes")
      .select("id, projeto_id, status, ordem")
      .in("projeto_id", projetoIds);

    const atribsByProjeto = new Map<string, { id: string; ordem: number; status: string }[]>();
    for (const a of atribs ?? []) {
      const pid = a.projeto_id as string;
      const arr = atribsByProjeto.get(pid) ?? [];
      arr.push({ id: a.id, ordem: a.ordem, status: a.status });
      atribsByProjeto.set(pid, arr);
    }

    const atribuicaoIds = (atribs ?? []).map((a) => a.id);
    const notaByAtribId = new Map<string, number>();
    if (atribuicaoIds.length > 0) {
      const { data: avs } = await supabase
        .from("avaliacoes")
        .select("atribuicao_id, nota_total_ponderada")
        .in("atribuicao_id", atribuicaoIds);
      for (const av of avs ?? []) {
        notaByAtribId.set(av.atribuicao_id, Number(av.nota_total_ponderada));
      }
    }

    for (const pid of projetoIds) {
      const list = atribsByProjeto.get(pid) ?? [];
      const stats = qtdNotasEDispersaoParPrincipal(list, notaByAtribId);
      const { media: mediaNotaFinal } = mediaNotasTotaisProjeto(list, notaByAtribId);
      statsByProjetoId.set(pid, { ...stats, mediaNotaFinal });
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
              const stats = statsByProjetoId.get(r.projeto_id) ?? {
                qtdNotas: 0,
                cvPct: null,
                mediaNotaFinal: null,
              };
              const notaFinalExibida = stats.mediaNotaFinal ?? Number(r.nota_final);
              return (
                <TableRow key={r.id}>
                  <TableCell>{r.posicao_geral ?? "—"}</TableCell>
                  <TableCell className="font-medium">{p?.nome_projeto}</TableCell>
                  <TableCell>{p?.nome_responsavel}</TableCell>
                  <TableCell>{p?.municipio}</TableCell>
                  <TableCell className="text-right tabular-nums">{stats.qtdNotas || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{stats.cvPct === null ? "—" : stats.cvPct.toFixed(2)}</TableCell>
                  <TableCell className="tabular-nums">{notaFinalExibida.toFixed(2)}</TableCell>
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
