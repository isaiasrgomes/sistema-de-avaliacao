import PDFDocument from "pdfkit";
import type { SupabaseClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import SVGtoPDF from "svg-to-pdfkit";
import { getStatusLabel } from "@/lib/utils/status";

const logoHeaderPath = path.join(process.cwd(), "public", "logo-sertao-inovador.svg");
const logoHeaderSvg = fs.existsSync(logoHeaderPath) ? fs.readFileSync(logoHeaderPath, "utf-8") : null;
const BRAND_RED = "#B91C1C";
const BRAND_RED_SOFT = "#FEE2E2";
const BRAND_GREEN_DARK = "#14532D";
const BRAND_GREEN_SOFT = "#DCFCE7";
const ROW_HEIGHT = 28;

function docHeader(doc: InstanceType<typeof PDFDocument>, titulo: string) {
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const left = doc.page.margins.left;
  const top = doc.y;

  doc.save();
  doc.roundedRect(left, top, pageWidth, 76, 10).fill(BRAND_RED_SOFT);
  doc.roundedRect(left, top, 8, 76, 10).fill(BRAND_RED);
  doc.restore();

  const logoStripX = left + 14;
  const logoStripY = top + 12;
  const logoStripW = 150;

  if (logoHeaderSvg) {
    SVGtoPDF(doc, logoHeaderSvg, logoStripX, logoStripY, {
      width: logoStripW,
      height: 30,
      preserveAspectRatio: "xMidYMid meet",
    });
  }

  const textX = logoStripX + logoStripW + 14;
  doc.fillColor(BRAND_RED).fontSize(15).font("Helvetica-Bold");
  doc.text("SerTão Inovador - Edital 45/2026", textX, top + 14);
  doc.fontSize(11).font("Helvetica");
  doc.fillColor("#1F2937").text(titulo, textX, top + 36, { lineGap: 2 });
  doc
    .fontSize(9)
    .fillColor(BRAND_GREEN_DARK)
    .text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, textX, top + 58);

  doc.moveDown(4.6);
  doc.fillColor("#0F172A").font("Helvetica");
}

function aplicarRodapeInstitucional(doc: InstanceType<typeof PDFDocument>) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i += 1) {
    doc.switchToPage(i);
    const y = doc.page.height - doc.page.margins.bottom / 2;
    doc
      .fontSize(8)
      .fillColor(BRAND_GREEN_DARK)
      .text(`Pagina ${i + 1} de ${range.count}`, doc.page.width - doc.page.margins.right - 100, y, {
        width: 100,
        align: "right",
        lineBreak: false,
      });
  }
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
  doc.text(index, x + 3, y + 9, { width: col.index - 6 });
  doc.text(projeto, x + col.index + 3, y + 9, { width: col.projeto - 8, lineGap: 1 });
  doc.text(responsavel, x + col.index + col.projeto + 3, y + 9, { width: col.responsavel - 8, lineGap: 1 });
  doc.text(municipio, x + col.index + col.projeto + col.responsavel + 3, y + 9, { width: col.municipio - 8 });
  doc.text(nota, x + col.index + col.projeto + col.responsavel + col.municipio + 3, y + 9, {
    width: col.nota - 8,
    align: "center",
  });
  doc.text(status, x + col.index + col.projeto + col.responsavel + col.municipio + col.nota + 3, y + 9, {
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
  const doc = new PDFDocument({ margin: 50, bufferPages: true });
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

  doc.roundedRect(tableX, rowY, tableWidth, ROW_HEIGHT, 6).fill(BRAND_RED_SOFT);
  doc.fillColor(BRAND_RED).font("Helvetica-Bold").fontSize(9);
  drawRow(doc, rowY, "#", "Projeto", "Responsavel", "Municipio", "Nota", "Status");
  doc.font("Helvetica");
  rowY += ROW_HEIGHT + 2;

  for (const [idx, r] of list.entries()) {
    const p = r.projetos as {
      nome_projeto: string;
      nome_responsavel: string;
      municipio: string;
    };
    if (rowY > doc.page.height - 96) {
      doc.addPage();
      rowY = doc.page.margins.top;
      doc.roundedRect(tableX, rowY, tableWidth, ROW_HEIGHT, 6).fill(BRAND_RED_SOFT);
      doc.fillColor(BRAND_RED).font("Helvetica-Bold").fontSize(9);
      drawRow(doc, rowY, "#", "Projeto", "Responsavel", "Municipio", "Nota", "Status");
      doc.font("Helvetica");
      rowY += ROW_HEIGHT + 2;
    }

    if (idx % 2 === 0) {
      doc.roundedRect(tableX, rowY, tableWidth, ROW_HEIGHT, 4).fill(BRAND_GREEN_SOFT);
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
      getStatusLabel(String(r.status_final ?? "-"))
    );
    rowY += ROW_HEIGHT + 2;
  }

  aplicarRodapeInstitucional(doc);
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
  const { data: avs } =
    ids.length > 0
      ? await supabase.from("avaliacoes").select("*").in("atribuicao_id", ids)
      : { data: [] as Record<string, unknown>[] };

  const chunks: Buffer[] = [];
  const doc = new PDFDocument({ margin: 50, bufferPages: true });
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  docHeader(doc, "Parecer consolidado (dados da avaliação)");
  doc.fontSize(11).font("Helvetica");
  if (p) {
    doc.roundedRect(doc.page.margins.left, doc.y, doc.page.width - 100, 84, 8).fill(BRAND_RED_SOFT);
    doc.roundedRect(doc.page.margins.left, doc.y, 6, 84, 8).fill(BRAND_RED);
    const detailTop = doc.y - 84;
    doc.fillColor(BRAND_RED).font("Helvetica-Bold").text("Dados do Projeto", doc.page.margins.left + 12, detailTop + 12);
    doc.font("Helvetica").fillColor("#1E293B");
    doc.text(`Projeto: ${p.nome_projeto}`, doc.page.margins.left + 12, detailTop + 34, { lineGap: 2 });
    doc.text(`Responsavel: ${p.nome_responsavel}`, { lineGap: 2 });
    doc.text(`Municipio: ${p.municipio}`, { lineGap: 2 });
    doc.moveDown(1.8);
  }
  if (res) {
    doc.roundedRect(doc.page.margins.left, doc.y, doc.page.width - 100, 92, 8).fill(BRAND_GREEN_SOFT);
    doc.roundedRect(doc.page.margins.left, doc.y, 6, 92, 8).fill(BRAND_GREEN_DARK);
    const resultTop = doc.y - 92;
    doc.fillColor(BRAND_GREEN_DARK).font("Helvetica-Bold").text("Resultado Consolidado", doc.page.margins.left + 12, resultTop + 12);
    doc.font("Helvetica").fillColor("#1E293B");
    doc.text(`Nota final: ${Number(res.nota_final ?? 0).toFixed(2)}`, doc.page.margins.left + 12, resultTop + 36, { lineGap: 2 });
    doc.text(`Status: ${getStatusLabel(String(res.status_final ?? "-"))}`, { lineGap: 2 });
    doc.text(`Posicao geral: ${res.posicao_geral ?? "-"}`, { lineGap: 2 });
    doc.moveDown(1.8);
  }
  doc.fontSize(10).font("Helvetica-Bold").fillColor(BRAND_RED).text("Sintese de criterios");
  doc.font("Helvetica").fillColor("#334155");
  if (res) {
    doc.text(
      `Equipe: ${res.media_equipe ?? "-"} | Mercado: ${res.media_mercado ?? "-"} | Produto: ${res.media_produto ?? "-"} | Tecnologia: ${res.media_tecnologia ?? "-"}`,
      { lineGap: 3 }
    );
  }
  doc.moveDown(1);
  doc.font("Helvetica-Bold").fillColor(BRAND_GREEN_DARK).text("Resumo:");
  doc
    .font("Helvetica")
    .fillColor("#334155")
    .text(`Quantidade de avaliacoes consolidadas: ${avs?.length ?? 0}`);
  aplicarRodapeInstitucional(doc);
  doc.end();
  return done;
}
