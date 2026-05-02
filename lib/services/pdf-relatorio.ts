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
      .text(`Página ${i + 1} de ${range.count}`, doc.page.width - doc.page.margins.right - 100, y, {
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

type AvaliacaoPdf = {
  nota_equipe: number;
  nota_mercado: number;
  nota_produto: number;
  nota_tecnologia: number;
  nota_total_ponderada: number;
  justificativa_geral: string | null;
  observacoes_gerais: string | null;
};

function pickAvPdf(av: AvaliacaoPdf | AvaliacaoPdf[] | null): AvaliacaoPdf | null {
  if (!av) return null;
  return Array.isArray(av) ? av[0] ?? null : av;
}

export async function gerarParecerProjetoPDFBuffer(
  supabase: SupabaseClient,
  projetoId: string
): Promise<Buffer> {
  const { data: p } = await supabase.from("projetos").select("*").eq("id", projetoId).single();
  const { data: atribsRaw } = await supabase
    .from("atribuicoes")
    .select(
      `ordem, status,
       avaliacoes ( nota_equipe, nota_mercado, nota_produto, nota_tecnologia, nota_total_ponderada, justificativa_geral, observacoes_gerais )`
    )
    .eq("projeto_id", projetoId)
    .order("ordem", { ascending: true });

  const comAvaliacao = (atribsRaw ?? [])
    .map((row) => {
      const av = pickAvPdf(row.avaliacoes as AvaliacaoPdf | AvaliacaoPdf[] | null);
      return av ? { ordem: row.ordem as number, av } : null;
    })
    .filter((x): x is { ordem: number; av: AvaliacaoPdf } => x != null)
    .sort((a, b) => a.ordem - b.ordem);

  const notasTotais = comAvaliacao.map((c) => Number(c.av.nota_total_ponderada));
  const mediaEntre =
    notasTotais.length > 0 ? (notasTotais.reduce((s, v) => s + v, 0) / notasTotais.length).toFixed(2) : null;

  const chunks: Buffer[] = [];
  /* bufferPages + rodapé por página geravam páginas extras vazias neste documento; fluxo simples sem numeração. */
  const doc = new PDFDocument({ margin: 50, autoFirstPage: true });
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  docHeader(doc, "Síntese de avaliações");

  const margin = doc.page.margins.left;
  const pageInnerW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const gap = 18;
  const colW = (pageInnerW - gap) / 2;
  const leftX = margin;
  const rightX = margin + colW + gap;
  const pad = 10;

  const leftBlock =
    p != null
      ? `Nome do projeto:\n${String(p.nome_projeto ?? "-")}\n\nProprietário / responsável:\n${String(p.nome_responsavel ?? "-")}`
      : "Projeto não encontrado.";

  const resumoDir =
    comAvaliacao.length === 0
      ? "Nenhuma avaliação registrada."
      : `Avaliadores com parecer: ${comAvaliacao.length}\n` +
        (mediaEntre != null ? `Média entre avaliadores (total ponderado): ${mediaEntre}\n` : "") +
        "\n(Notas por critério e textos seguem abaixo.)";

  doc.font("Helvetica-Bold").fontSize(10).fillColor(BRAND_RED);
  const hTitLeft = doc.heightOfString("Proponente", { width: colW - pad * 2 });
  doc.font("Helvetica").fontSize(9).fillColor("#1E293B");
  const hLeft = hTitLeft + doc.heightOfString(leftBlock, { width: colW - pad * 2, lineGap: 2 });

  doc.font("Helvetica-Bold").fontSize(10).fillColor(BRAND_GREEN_DARK);
  const tituloAval = "Avaliações";
  const hTitRight = doc.heightOfString(tituloAval, { width: colW - pad * 2 });
  doc.font("Helvetica").fontSize(9).fillColor("#1E293B");
  const hRight = hTitRight + doc.heightOfString(resumoDir, { width: colW - pad * 2, lineGap: 2 });

  let y0 = doc.y;
  const rowH = Math.max(hLeft, hRight, 72) + pad * 2;

  if (y0 + rowH > doc.page.height - doc.page.margins.bottom - 48) {
    doc.addPage();
    y0 = doc.page.margins.top;
  }

  doc.save();
  doc.roundedRect(leftX, y0, colW, rowH, 6).fill(BRAND_RED_SOFT);
  doc.roundedRect(rightX, y0, colW, rowH, 6).fill(BRAND_GREEN_SOFT);
  doc.restore();

  doc.font("Helvetica-Bold").fontSize(10).fillColor(BRAND_RED).text("Proponente", leftX + pad, y0 + pad, { width: colW - pad * 2 });
  doc.font("Helvetica").fontSize(9).fillColor("#1E293B").text(leftBlock, leftX + pad, y0 + pad + hTitLeft + 4, {
    width: colW - pad * 2,
    lineGap: 2,
  });

  doc.font("Helvetica-Bold").fontSize(10).fillColor(BRAND_GREEN_DARK);
  doc.text(tituloAval, rightX + pad, y0 + pad, { width: colW - pad * 2 });
  doc.font("Helvetica").fontSize(9).fillColor("#1E293B");
  doc.text(resumoDir, rightX + pad, y0 + pad + hTitRight + 4, { width: colW - pad * 2, lineGap: 2 });

  /* Posicionamento absoluto altera doc.x/doc.y; alinhar cursor ao fluxo na margem esquerda, abaixo do bloco duplo. */
  doc.x = doc.page.margins.left;
  doc.y = y0 + rowH + 14;

  const fullW = pageInnerW;

  doc.font("Helvetica-Bold").fontSize(11).fillColor(BRAND_RED).text("Notas por avaliador", { width: fullW, lineGap: 4 });
  doc.moveDown(0.3);
  doc.font("Helvetica").fontSize(9).fillColor("#334155");
  if (comAvaliacao.length === 0) {
    doc.text("Nenhum registro de avaliação.", { width: fullW, lineGap: 2 });
  } else {
    comAvaliacao.forEach((c, i) => {
      const av = c.av;
      doc.moveDown(0.2);
      doc.font("Helvetica-Bold").text(`Avaliador ${i + 1}`, { width: fullW, lineGap: 2 });
      doc.font("Helvetica");
      doc.text(
        `Equipe empreendedora: ${av.nota_equipe} | Problema e mercado: ${av.nota_mercado} | Produto/solução: ${av.nota_produto} | Tecnologia: ${av.nota_tecnologia}`,
        { width: fullW, lineGap: 2 }
      );
      doc.text(`Total ponderado: ${Number(av.nota_total_ponderada).toFixed(2)}`, { width: fullW, lineGap: 2 });
    });
    if (mediaEntre != null) {
      doc.moveDown(0.3);
      doc.font("Helvetica-Bold").text(`Média entre avaliadores (total ponderado): ${mediaEntre}`, { width: fullW, lineGap: 2 });
    }
  }

  doc.moveDown(0.8);
  doc.font("Helvetica-Bold").fontSize(11).fillColor(BRAND_GREEN_DARK).text("Justificativas e observações", { width: fullW, lineGap: 4 });
  doc.font("Helvetica").fontSize(9).fillColor("#334155");
  if (comAvaliacao.length === 0) {
    doc.text("—", { width: fullW, lineGap: 2 });
  } else {
    comAvaliacao.forEach((c, i) => {
      const av = c.av;
      const j = (av.justificativa_geral ?? "").trim() || "(sem justificativa registrada)";
      const o = (av.observacoes_gerais ?? "").trim() || "(sem observações registradas)";
      doc.moveDown(0.4);
      doc.font("Helvetica-Bold").text(`Avaliador ${i + 1}`, { width: fullW, lineGap: 2 });
      doc.font("Helvetica");
      doc.text(`Justificativa geral:\n${j}`, { width: fullW, lineGap: 2 });
      doc.text(`Observações gerais:\n${o}`, { width: fullW, lineGap: 2 });
    });
  }

  doc.end();
  return done;
}
