import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";
import SVGtoPDF from "svg-to-pdfkit";
import { MANUAIS, type ManualPerfil } from "@/lib/manuals/manual-content";

const logoHeaderPath = path.join(process.cwd(), "public", "logo-sertao-inovador.svg");
const logoHeaderSvg = fs.existsSync(logoHeaderPath) ? fs.readFileSync(logoHeaderPath, "utf-8") : null;
const BRAND_RED = "#B91C1C";
const BRAND_RED_SOFT = "#FEE2E2";
const BRAND_GREEN_DARK = "#14532D";
const BRAND_GREEN_SOFT = "#DCFCE7";

function header(doc: InstanceType<typeof PDFDocument>, title: string, subtitle: string) {
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const left = doc.page.margins.left;
  const top = doc.y;

  doc.save();
  doc.roundedRect(left, top, pageWidth, 96, 10).fill(BRAND_RED_SOFT);
  doc.roundedRect(left, top, 8, 96, 10).fill(BRAND_RED);
  doc.restore();

  if (logoHeaderSvg) {
    SVGtoPDF(doc, logoHeaderSvg, left + 14, top + 12, {
      width: 170,
      height: 34,
      preserveAspectRatio: "xMidYMid meet",
    });
  }

  doc.fillColor(BRAND_RED).fontSize(15).font("Helvetica-Bold");
  doc.text(title, left + 196, top + 16);
  doc.font("Helvetica").fontSize(10).fillColor("#1F2937");
  doc.text(subtitle, left + 196, top + 40, { width: pageWidth - 214, lineGap: 2 });
  doc
    .fontSize(9)
    .fillColor(BRAND_GREEN_DARK)
    .text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, left + 196, top + 74);
  doc.moveDown(5);
}

function footer(doc: InstanceType<typeof PDFDocument>) {
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

export async function gerarManualPDFBuffer(perfil: ManualPerfil): Promise<Buffer> {
  const manual = MANUAIS[perfil];
  const chunks: Buffer[] = [];
  const doc = new PDFDocument({ margin: 50, bufferPages: true });
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  header(doc, "SerTao Inovador - Manual do Sistema", manual.titulo);
  doc.font("Helvetica").fontSize(10).fillColor("#374151");
  doc.text(manual.subtitulo, { lineGap: 3 });
  doc.moveDown(1.2);

  for (const secao of manual.secoes) {
    if (doc.y > doc.page.height - 160) doc.addPage();
    doc.roundedRect(doc.page.margins.left, doc.y, doc.page.width - 100, 24, 6).fill(BRAND_RED_SOFT);
    doc.roundedRect(doc.page.margins.left, doc.y, 6, 24, 6).fill(BRAND_RED);
    const currentY = doc.y - 24;
    doc.font("Helvetica-Bold").fontSize(11).fillColor(BRAND_RED);
    doc.text(secao.titulo, doc.page.margins.left + 12, currentY + 6);
    doc.moveDown(1);
    doc.font("Helvetica").fontSize(10).fillColor("#374151");
    doc.text(secao.descricao, { lineGap: 3 });
    doc.moveDown(0.8);

    secao.passos.forEach((passo, idx) => {
      if (doc.y > doc.page.height - 95) doc.addPage();
      const bulletY = doc.y + 1;
      doc.circle(doc.page.margins.left + 8, bulletY + 4, 2.2).fill(BRAND_GREEN_DARK);
      doc.font("Helvetica").fontSize(10).fillColor("#111827");
      doc.text(`${idx + 1}) ${passo}`, doc.page.margins.left + 16, bulletY, {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right - 20,
        lineGap: 3,
      });
      doc.moveDown(0.5);
    });
    doc.roundedRect(doc.page.margins.left, doc.y + 2, doc.page.width - 100, 8, 4).fill(BRAND_GREEN_SOFT);
    doc.moveDown(1.3);
  }

  footer(doc);
  doc.end();
  return done;
}
