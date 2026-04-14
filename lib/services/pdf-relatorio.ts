import PDFDocument from "pdfkit";
import type { SupabaseClient } from "@supabase/supabase-js";

function docHeader(doc: InstanceType<typeof PDFDocument>, titulo: string) {
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const top = doc.y;

  doc.save();
  doc.roundedRect(doc.page.margins.left, top, pageWidth, 68, 10).fill("#F1F7FF");
  doc
    .roundedRect(doc.page.margins.left + 10, top + 10, 5, 48, 3)
    .fill("#1D4ED8");
  doc.restore();

  doc.fillColor("#0F172A").fontSize(15).font("Helvetica-Bold");
  doc.text("Sertao Maker - Edital 45/2026", doc.page.margins.left + 22, top + 14);
  doc.fontSize(11).font("Helvetica");
  doc.fillColor("#334155").text(titulo, doc.page.margins.left + 22, top + 36);
  doc
    .fontSize(9)
    .fillColor("#64748B")
    .text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, doc.page.margins.left + 22, top + 51);

  doc.moveDown(4.2);
  doc.fillColor("#0F172A").font("Helvetica");
}

function drawRow(
  doc: InstanceType<typeof PDFDocument>,
  y: number,
  index: string,
  projeto: string,
  responsavel: string,
  municipio: string,
  nota: string,
  status: string
) {
  const x = doc.page.margins.left;
  const col = {
    index: 24,
    projeto: 165,
    responsavel: 125,
    municipio: 80,
    nota: 50,
    status: 80,
  };

  doc.fontSize(9).fillColor("#0F172A");
  doc.text(index, x + 3, y + 6, { width: col.index - 6 });
  doc.text(projeto, x + col.index + 3, y + 6, { width: col.projeto - 8 });
  doc.text(responsavel, x + col.index + col.projeto + 3, y + 6, { width: col.responsavel - 8 });
  doc.text(municipio, x + col.index + col.projeto + col.responsavel + 3, y + 6, { width: col.municipio - 8 });
  doc.text(nota, x + col.index + col.projeto + col.responsavel + col.municipio + 3, y + 6, {
    width: col.nota - 8,
    align: "center",
  });
  doc.text(status, x + col.index + col.projeto + col.responsavel + col.municipio + col.nota + 3, y + 6, {
    width: col.status - 8,
    align: "center",
  });
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

  const tableX = doc.page.margins.left;
  const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  let rowY = doc.y;

  doc.roundedRect(tableX, rowY, tableWidth, 22, 6).fill("#DBEAFE");
  doc.fillColor("#1E3A8A").font("Helvetica-Bold").fontSize(9);
  drawRow(doc, rowY, "#", "Projeto", "Responsavel", "Municipio", "Nota", "Status");
  doc.font("Helvetica");
  rowY += 24;

  for (const [idx, r] of list.entries()) {
    const p = r.projetos as {
      nome_projeto: string;
      nome_responsavel: string;
      municipio: string;
    };
    if (rowY > doc.page.height - 90) {
      doc.addPage();
      rowY = doc.page.margins.top;
      doc.roundedRect(tableX, rowY, tableWidth, 22, 6).fill("#DBEAFE");
      doc.fillColor("#1E3A8A").font("Helvetica-Bold").fontSize(9);
      drawRow(doc, rowY, "#", "Projeto", "Responsavel", "Municipio", "Nota", "Status");
      doc.font("Helvetica");
      rowY += 24;
    }

    if (idx % 2 === 0) {
      doc.roundedRect(tableX, rowY, tableWidth, 22, 4).fill("#F8FAFC");
    }
    doc.fillColor("#0F172A");
    drawRow(
      doc,
      rowY,
      String(idx + 1),
      p?.nome_projeto ?? "-",
      p?.nome_responsavel ?? "-",
      p?.municipio ?? "-",
      Number(r.nota_final ?? 0).toFixed(2),
      String(r.status_final ?? "-")
    );
    rowY += 24;
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
  doc.fontSize(11).font("Helvetica");
  if (p) {
    doc.roundedRect(doc.page.margins.left, doc.y, doc.page.width - 100, 74, 8).fill("#F8FAFC");
    const detailTop = doc.y - 74;
    doc.fillColor("#0F172A").font("Helvetica-Bold").text("Dados do Projeto", doc.page.margins.left + 12, detailTop + 10);
    doc.font("Helvetica").fillColor("#1E293B");
    doc.text(`Projeto: ${p.nome_projeto}`, doc.page.margins.left + 12, detailTop + 28);
    doc.text(`Responsavel: ${p.nome_responsavel}`);
    doc.text(`Municipio: ${p.municipio}`);
    doc.moveDown(1.6);
  }
  if (res) {
    doc.roundedRect(doc.page.margins.left, doc.y, doc.page.width - 100, 84, 8).fill("#EFF6FF");
    const resultTop = doc.y - 84;
    doc.fillColor("#1E3A8A").font("Helvetica-Bold").text("Resultado Consolidado", doc.page.margins.left + 12, resultTop + 10);
    doc.font("Helvetica").fillColor("#1E293B");
    doc.text(`Nota final: ${Number(res.nota_final ?? 0).toFixed(2)}`, doc.page.margins.left + 12, resultTop + 30);
    doc.text(`Status: ${res.status_final ?? "-"}`);
    doc.text(`Posicao geral: ${res.posicao_geral ?? "-"}`);
    doc.moveDown(1.7);
  }
  doc.fontSize(10).font("Helvetica-Bold").fillColor("#0F172A").text("Sintese de criterios");
  doc.font("Helvetica").fillColor("#334155");
  if (res) {
    doc.text(
      `Equipe: ${res.media_equipe ?? "-"} | Mercado: ${res.media_mercado ?? "-"} | Produto: ${res.media_produto ?? "-"} | Tecnologia: ${res.media_tecnologia ?? "-"}`
    );
  }
  doc.moveDown();
  doc.font("Helvetica-Bold").fillColor("#0F172A").text("Resumo:");
  doc
    .font("Helvetica")
    .fillColor("#334155")
    .text(`Quantidade de avaliacoes consolidadas: ${avs?.length ?? 0}`);
  doc.end();
  return done;
}
