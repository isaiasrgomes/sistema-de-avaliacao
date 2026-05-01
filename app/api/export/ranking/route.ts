import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getStatusLabel } from "@/lib/utils/status";
import { mediaNotasTotaisProjeto, qtdNotasEDispersaoParPrincipal } from "@/lib/services/nota";

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
    const stats = statsByProjetoId.get(r.projeto_id) ?? { qtdNotas: 0, cvPct: null, mediaNotaFinal: null };
    const notaFinalExibida = stats.mediaNotaFinal ?? Number(r.nota_final);
    lines.push(
      [
        r.posicao_geral ?? "",
        p?.nome_projeto ?? "",
        p?.nome_responsavel ?? "",
        p?.municipio ?? "",
        stats.qtdNotas ? String(stats.qtdNotas) : "",
        stats.cvPct === null ? "" : stats.cvPct.toFixed(2),
        notaFinalExibida.toFixed(2),
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
