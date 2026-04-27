import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getStatusLabel } from "@/lib/utils/status";

export async function GET() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "COORDENADOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: rows } = await supabase
    .from("resultados")
    .select("posicao_geral, nota_final, status_final, enquadramento_cota, projeto_id, projetos(nome_projeto, nome_responsavel, municipio, is_sertao)")
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

  const header = [
    "posicao",
    "projeto",
    "responsavel",
    "municipio",
    "qtd_notas",
    "dif_pct",
    "nota_final",
    "status_final",
    "cota",
    "is_sertao",
  ];
  const lines = [header.join(";")];
  for (const r of rows ?? []) {
    const p = r.projetos as unknown as {
      nome_projeto: string;
      nome_responsavel: string;
      municipio: string;
      is_sertao: boolean;
    };
    const stats = statsByProjetoId.get(r.projeto_id) ?? { qtdNotas: 0, cvPct: null };
    lines.push(
      [
        r.posicao_geral ?? "",
        p?.nome_projeto ?? "",
        p?.nome_responsavel ?? "",
        p?.municipio ?? "",
        stats.qtdNotas ? String(stats.qtdNotas) : "",
        stats.cvPct === null ? "" : stats.cvPct.toFixed(2),
        r.nota_final,
        getStatusLabel(r.status_final),
        r.enquadramento_cota ? "sim" : "nao",
        p?.is_sertao ? "sim" : "nao",
      ].join(";")
    );
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="ranking-completo.csv"',
    },
  });
}
