import { createServerSupabase } from "@/lib/supabase/server";
import { RankingClient } from "./ranking-client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function RankingPage() {
  const supabase = await createServerSupabase();
  const { data: cfg } = await supabase.from("app_config").select("*").eq("id", 1).single();
  const { data: rows } = await supabase
    .from("resultados")
    .select("*, projetos(*)")
    .order("posicao_geral", { ascending: true, nullsFirst: false });

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
              <TableHead>Nota final</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cota</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(rows ?? []).map((r) => {
              const p = r.projetos as { nome_projeto: string; nome_responsavel: string; municipio: string };
              return (
                <TableRow key={r.id}>
                  <TableCell>{r.posicao_geral ?? "—"}</TableCell>
                  <TableCell className="font-medium">{p?.nome_projeto}</TableCell>
                  <TableCell>{p?.nome_responsavel}</TableCell>
                  <TableCell>{p?.municipio}</TableCell>
                  <TableCell>{Number(r.nota_final).toFixed(2)}</TableCell>
                  <TableCell>{r.status_final}</TableCell>
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
