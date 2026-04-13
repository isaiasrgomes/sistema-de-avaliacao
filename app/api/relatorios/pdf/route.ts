import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { gerarParecerProjetoPDFBuffer, gerarRelatorioPDFBuffer } from "@/lib/services/pdf-relatorio";

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
    const buf = await gerarParecerProjetoPDFBuffer(supabase, projetoId);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="parecer-${projetoId}.pdf"`,
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
