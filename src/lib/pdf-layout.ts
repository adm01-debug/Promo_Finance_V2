import type jsPDF from 'jspdf';

/**
 * Padrão visual de PDFs do sistema.
 * Cores derivadas dos design tokens (HSL convertido para RGB).
 *
 *   --primary   24 95% 46%  → #E66A0A  (laranja)
 *   --secondary 215 90% 42% → #0B5FCB  (azul)
 *   --foreground 225 35% 8% → #0D1424
 *   --muted-foreground 225 22% 38% → #4B5775
 *   --border    35 18% 82%  → #DAD2C7
 */
export const PDF_BRAND = {
  primary: [230, 106, 10] as [number, number, number],
  secondary: [11, 95, 203] as [number, number, number],
  foreground: [13, 20, 36] as [number, number, number],
  muted: [75, 87, 117] as [number, number, number],
  border: [218, 210, 199] as [number, number, number],
  surface: [250, 247, 242] as [number, number, number],
  destructive: [196, 28, 28] as [number, number, number],
  warning: [201, 128, 8] as [number, number, number],
  success: [22, 122, 73] as [number, number, number],
} as const;

export interface PdfLayoutOptions {
  /** Título principal exibido no cabeçalho. */
  titulo: string;
  /** Subtítulo opcional (ex.: "SPED ECD · 2024 (filtrado)"). */
  subtitulo?: string;
  /** Nome curto da marca exibido no logo. */
  marca?: string;
  /** Linha discreta exibida à direita no rodapé (ex.: hash, ref). */
  rodapeInfo?: string;
}

const HEADER_HEIGHT = 22;
const FOOTER_HEIGHT = 14;
const MARGIN_X = 14;

function setFillRgb(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}
function setDrawRgb(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}
function setTextRgb(doc: jsPDF, rgb: readonly [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

/**
 * Y-coordinate (mm) onde o conteúdo da página deve começar,
 * logo abaixo do cabeçalho padronizado.
 */
export function getContentStartY() {
  return HEADER_HEIGHT + 8;
}

/**
 * Margens reservadas para autoTable respeitando cabeçalho/rodapé.
 */
export function getAutoTableMargins() {
  return {
    top: HEADER_HEIGHT + 8,
    bottom: FOOTER_HEIGHT + 6,
    left: MARGIN_X,
    right: MARGIN_X,
  };
}

function drawHeader(doc: jsPDF, opts: PdfLayoutOptions) {
  const pageWidth = doc.internal.pageSize.getWidth();
  // Fundo do cabeçalho
  setFillRgb(doc, PDF_BRAND.foreground);
  doc.rect(0, 0, pageWidth, HEADER_HEIGHT, 'F');
  // Faixa accent inferior (laranja)
  setFillRgb(doc, PDF_BRAND.primary);
  doc.rect(0, HEADER_HEIGHT, pageWidth, 1.2, 'F');

  // Logo: quadrado laranja com inicial
  const marca = opts.marca ?? 'PromoFinance';
  const logoSize = 10;
  const logoX = MARGIN_X;
  const logoY = (HEADER_HEIGHT - logoSize) / 2;
  setFillRgb(doc, PDF_BRAND.primary);
  doc.roundedRect(logoX, logoY, logoSize, logoSize, 1.6, 1.6, 'F');
  setTextRgb(doc, [255, 255, 255]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(marca.charAt(0).toUpperCase(), logoX + logoSize / 2, logoY + logoSize / 2 + 1.2, {
    align: 'center',
  });

  // Marca textual ao lado do logo
  setTextRgb(doc, [255, 255, 255]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(marca, logoX + logoSize + 3, HEADER_HEIGHT / 2 - 0.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(210, 210, 210);
  doc.text('Relatório gerado pelo sistema', logoX + logoSize + 3, HEADER_HEIGHT / 2 + 3.5);

  // Título à direita
  setTextRgb(doc, [255, 255, 255]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(opts.titulo, pageWidth - MARGIN_X, HEADER_HEIGHT / 2 - 0.5, { align: 'right' });
  if (opts.subtitulo) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(215, 215, 215);
    doc.text(opts.subtitulo, pageWidth - MARGIN_X, HEADER_HEIGHT / 2 + 3.8, { align: 'right' });
  }
}

function drawFooter(doc: jsPDF, opts: PdfLayoutOptions, pageNum: number, totalPages: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const y = pageHeight - FOOTER_HEIGHT;

  // Linha separadora
  setDrawRgb(doc, PDF_BRAND.border);
  doc.setLineWidth(0.2);
  doc.line(MARGIN_X, y, pageWidth - MARGIN_X, y);

  // Esquerda: data/hora
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setTextRgb(doc, PDF_BRAND.muted);
  const geradoEm = `Gerado em ${new Date().toLocaleString('pt-BR')}`;
  doc.text(geradoEm, MARGIN_X, y + 5);

  // Centro: info opcional (ex. hash)
  if (opts.rodapeInfo) {
    doc.text(opts.rodapeInfo, pageWidth / 2, y + 5, { align: 'center' });
  }

  // Direita: paginação
  setTextRgb(doc, PDF_BRAND.foreground);
  doc.setFont('helvetica', 'bold');
  doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - MARGIN_X, y + 5, { align: 'right' });

  // Marca discreta
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  setTextRgb(doc, PDF_BRAND.muted);
  doc.text(opts.marca ?? 'PromoFinance', pageWidth - MARGIN_X, y + 9.5, { align: 'right' });
}

/**
 * Aplica cabeçalho e rodapé padronizados em todas as páginas do documento.
 * Deve ser chamado APÓS todo o conteúdo ter sido escrito.
 */
export function applyPdfLayout(doc: jsPDF, opts: PdfLayoutOptions) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawHeader(doc, opts);
    drawFooter(doc, opts, i, pageCount);
  }
  // Restaura defaults para callers que continuem desenhando
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(PDF_BRAND.foreground[0], PDF_BRAND.foreground[1], PDF_BRAND.foreground[2]);
}
