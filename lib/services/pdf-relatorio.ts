import PDFDocument from "pdfkit";
import type { SupabaseClient } from "@supabase/supabase-js";

function docHeader(doc: InstanceType<typeof PDFDocument>, titulo: string) {
  doc.fontSize(16).text("Sertão Inovador — Edital 45/2026", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(12).text(titulo, { align: "center" });
  doc.moveDown(1);
}

export async function gerarRelatorioPDFBuffer(
  supabase: SupabaseClient,
  tipo: "PRELIMINAR" | "FINAL"
): Promise<Buffer> {
  const { data: rows } = await supabase
    .from("resultados")
    .select("*, projetos(*)")
    .order("nota_final", { ascending: false });

  const list = [...(rows ?? [])].sort((a, b) => {
    const na = (a.projetos as { nome_projeto: string })?.nome_projeto ?? "";
    const nb = (b.projetos as { nome_projeto: string })?.nome_projeto ?? "";
    return na.localeCompare(nb, "pt-BR");
  });

  const chunks: Buffer[] = [];
  const doc = new PDFDocument({ margin: 50 });
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  docHeader(
    doc,
    tipo === "FINAL" ? "Resultado final (ordem alfabética)" : "Resultado preliminar (ordem alfabética)"
  );

  doc.fontSize(10);
  for (const r of list) {
    const p = r.projetos as {
      nome_projeto: string;
      nome_responsavel: string;
      municipio: string;
    };
    doc.text(
      `${p?.nome_projeto ?? ""} — ${p?.nome_responsavel ?? ""} — ${p?.municipio ?? ""} — Nota: ${Number(r.nota_final).toFixed(2)} — ${r.status_final}`
    );
    doc.moveDown(0.3);
  }

  doc.end();
  return done;
}

export async function gerarParecerProjetoPDFBuffer(
  supabase: SupabaseClient,
  projetoId: string
): Promise<Buffer> {
  const { data: p } = await supabase.from("projetos").select("*").eq("id", projetoId).single();
  const { data: res } = await supabase.from("resultados").select("*").eq("projeto_id", projetoId).maybeSingle();
  const { data: atribs } = await supabase.from("atribuicoes").select("id").eq("projeto_id", projetoId);
  const ids = atribs?.map((a) => a.id) ?? [];
  const { data: avs } = await supabase.from("avaliacoes").select("*").in("atribuicao_id", ids);

  const chunks: Buffer[] = [];
  const doc = new PDFDocument({ margin: 50 });
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  docHeader(doc, "Parecer consolidado (dados da avaliação)");
  doc.fontSize(11);
  if (p) {
    doc.text(`Projeto: ${p.nome_projeto}`);
    doc.text(`Responsável: ${p.nome_responsavel}`);
    doc.text(`Município: ${p.municipio}`);
    doc.moveDown();
  }
  if (res) {
    doc.text(`Nota final: ${Number(res.nota_final).toFixed(2)}`);
    doc.text(`Status: ${res.status_final}`);
    doc.text(`Posição geral: ${res.posicao_geral ?? "—"}`);
    doc.moveDown();
  }
  doc.fontSize(10).text("Síntese das notas por critério (médias registradas no resultado):");
  if (res) {
    doc.text(`Equipe: ${res.media_equipe} | Mercado: ${res.media_mercado} | Produto: ${res.media_produto} | Tecnologia: ${res.media_tecnologia}`);
  }
  doc.moveDown();
  doc.text(`Quantidade de avaliações consolidadas: ${avs?.length ?? 0}`);
  doc.end();
  return done;
}
