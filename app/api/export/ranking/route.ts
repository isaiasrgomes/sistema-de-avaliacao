import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

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
    .select("posicao_geral, nota_final, status_final, enquadramento_cota, projetos(nome_projeto, nome_responsavel, municipio, is_sertao)")
    .order("posicao_geral", { ascending: true, nullsFirst: false });

  const header = ["posicao", "projeto", "responsavel", "municipio", "nota_final", "status_final", "cota", "is_sertao"];
  const lines = [header.join(";")];
  for (const r of rows ?? []) {
    const p = r.projetos as unknown as {
      nome_projeto: string;
      nome_responsavel: string;
      municipio: string;
      is_sertao: boolean;
    };
    lines.push(
      [
        r.posicao_geral ?? "",
        p?.nome_projeto ?? "",
        p?.nome_responsavel ?? "",
        p?.municipio ?? "",
        r.nota_final,
        r.status_final,
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
