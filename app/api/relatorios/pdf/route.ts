import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { gerarParecerProjetoPDFBuffer, gerarRelatorioPDFBuffer } from "@/lib/services/pdf-relatorio";

/** Nome de arquivo seguro + RFC 5987 para nomes com acentos. */
function contentDispositionParecer(nomeProjeto: string | null | undefined): string {
  const base = (nomeProjeto ?? "projeto").trim().replace(/[\u0000-\u001f<>:"/\\|?*]/g, "").slice(0, 100) || "projeto";
  const asciiStem =
    base
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72) || "projeto";
  const ascii = `parecer-${asciiStem}.pdf`;
  const utf8Name = `parecer-${base.replace(/\s+/g, " ").trim().slice(0, 72)}.pdf`;
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(utf8Name)}`;
}

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "COORDENADOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tipo = req.nextUrl.searchParams.get("tipo") as "PRELIMINAR" | "FINAL" | "PARECER" | null;
  const projetoId = req.nextUrl.searchParams.get("projetoId");

  if (tipo === "PARECER") {
    if (!projetoId) return NextResponse.json({ error: "projetoId obrigatório" }, { status: 400 });
    const { data: meta } = await supabase.from("projetos").select("nome_projeto").eq("id", projetoId).maybeSingle();
    const buf = await gerarParecerProjetoPDFBuffer(supabase, projetoId);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": contentDispositionParecer(meta?.nome_projeto ?? null),
      },
    });
  }

  if (tipo === "PRELIMINAR" || tipo === "FINAL") {
    const buf = await gerarRelatorioPDFBuffer(supabase, tipo);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="resultado-${tipo.toLowerCase()}.pdf"`,
      },
    });
  }

  return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
}
