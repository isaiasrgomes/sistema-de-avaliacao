import { NextRequest, NextResponse } from "next/server";
import { gerarManualPDFBuffer } from "@/lib/services/pdf-manual";
import type { ManualPerfil } from "@/lib/manuals/manual-content";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const perfil = req.nextUrl.searchParams.get("perfil") as ManualPerfil | null;
  if (perfil !== "admin" && perfil !== "avaliador") {
    return NextResponse.json({ error: "perfil inválido" }, { status: 400 });
  }
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, cadastro_aprovado, cadastro_recusado")
    .eq("id", user.id)
    .single();

  if (perfil === "admin" && profile?.role !== "COORDENADOR") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (perfil === "avaliador") {
    if (profile?.role === "COORDENADOR") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (profile?.cadastro_recusado === true || profile?.cadastro_aprovado !== true) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  const buf = await gerarManualPDFBuffer(perfil);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="manual-${perfil}.pdf"`,
    },
  });
}
