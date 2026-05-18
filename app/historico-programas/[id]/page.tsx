import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { labelTipoPrograma, type Programa, type ProgramaResultadoFinalRow } from "@/lib/programa/types";

function fmtDate(d: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("pt-BR");
  } catch {
    return d;
  }
}

function statusLabel(s: string) {
  if (s === "SELECIONADO") return "Selecionado";
  if (s === "SUPLENTE") return "Suplente";
  return "Não selecionado";
}

export default async function HistoricoProgramaDetalhePage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabase();
  const { data: programa } = await supabase
    .from("programas")
    .select("*")
    .eq("id", params.id)
    .eq("status", "FINALIZADO")
    .is("deleted_at", null)
    .maybeSingle();

  if (!programa) notFound();

  const p = programa as Programa;
  const { data: resultados } = await supabase
    .from("programa_resultado_final")
    .select("*")
    .eq("programa_id", p.id)
    .order("posicao_ranking", { ascending: true, nullsFirst: false });

  const linhas = (resultados ?? []) as ProgramaResultadoFinalRow[];

  return (
    <main className="mx-auto min-h-screen max-w-5xl space-y-6 px-6 py-10">
      <div className="space-y-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/historico-programas">← Histórico de programas</Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">{p.nome}</h1>
        <p className="text-sm text-muted-foreground">
          {labelTipoPrograma(p.tipo)} · {p.edital} · Finalizado em {fmtDate(p.data_finalizacao)}
        </p>
        <p className="text-xs text-muted-foreground">
          Critérios de avaliação: equipe (30%), mercado (30%), produto (20%), tecnologia (20%) — nota ponderada de 20
          a 100.
        </p>
      </div>

      <Card className="border-border/70 bg-card/85">
        <CardHeader>
          <CardTitle className="text-base">Ranking final ({linhas.length} projetos)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-muted-foreground">
                <th className="pb-2 pr-3">#</th>
                <th className="pb-2 pr-3">Projeto</th>
                <th className="pb-2 pr-3">Responsável</th>
                <th className="pb-2 pr-3">Município</th>
                <th className="pb-2 pr-3 text-right">Nota</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((r) => (
                <tr key={r.id} className="border-b border-border/40">
                  <td className="py-2 pr-3 tabular-nums">{r.posicao_ranking ?? "—"}</td>
                  <td className="py-2 pr-3 font-medium">{r.nome_projeto}</td>
                  <td className="py-2 pr-3">{r.nome_responsavel}</td>
                  <td className="py-2 pr-3">{r.municipio}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{Number(r.nota_final).toFixed(2)}</td>
                  <td className="py-2">
                    <Badge variant="outline">{statusLabel(r.status_final)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {linhas.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">Nenhum resultado registrado para este programa.</p>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
