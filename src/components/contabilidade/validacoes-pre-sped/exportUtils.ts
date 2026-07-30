import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { applyPdfLayout, getAutoTableMargins, getContentStartY, PDF_BRAND } from '@/lib/pdf-layout';
import { agruparValidacoes } from '@/lib/sped-validacoes-categorias';
import type { ValidacoesPreSpedArquivo } from './types';

interface ExportArgs {
  arquivo: ValidacoesPreSpedArquivo;
  erros: string[];
  avisos: string[];
  errosFiltrados: string[];
  avisosFiltrados: string[];
  busca: string;
  baseFilename: string;
  apenasFiltrados?: boolean;
}

export function exportarJson({
  arquivo,
  erros,
  avisos,
  errosFiltrados,
  avisosFiltrados,
  busca,
  baseFilename,
  apenasFiltrados = false,
}: ExportArgs): void {
  try {
    const errosExp = apenasFiltrados ? errosFiltrados : erros;
    const avisosExp = apenasFiltrados ? avisosFiltrados : avisos;
    const payload = {
      arquivo: {
        tipo: arquivo.tipo,
        ano_calendario: arquivo.ano_calendario,
        status: arquivo.status,
        hash_sha256: arquivo.hash_sha256,
        cnpj: arquivo.cnpj ?? null,
        razao_social: arquivo.razao_social ?? null,
        periodo: {
          inicio: arquivo.periodo_inicio ?? `${arquivo.ano_calendario}-01-01`,
          fim: arquivo.periodo_fim ?? `${arquivo.ano_calendario}-12-31`,
        },
        gerado_por: arquivo.gerado_por ?? null,
        gerado_em: arquivo.created_at ?? new Date().toISOString(),
        total_lancamentos: arquivo.total_lancamentos ?? null,
        total_linhas: arquivo.total_linhas ?? null,
      },
      filtro: apenasFiltrados ? { termo: busca.trim() } : null,
      totais: {
        erros: errosExp.length,
        avisos: avisosExp.length,
        erros_total: erros.length,
        avisos_total: avisos.length,
      },
      erros: errosExp,
      avisos: avisosExp,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseFilename}${apenasFiltrados ? '-filtrado' : ''}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(
      apenasFiltrados
        ? `JSON exportado com ${errosExp.length} erro(s) e ${avisosExp.length} aviso(s) filtrados`
        : 'Validações exportadas em JSON'
    );
  } catch (e) {
    console.error(e);
    toast.error('Erro ao exportar JSON');
  }
}

export function exportarPdf({
  arquivo,
  erros,
  avisos,
  errosFiltrados,
  avisosFiltrados,
  busca,
  baseFilename,
  apenasFiltrados = false,
}: ExportArgs): void {
  try {
    const errosExp = apenasFiltrados ? errosFiltrados : erros;
    const avisosExp = apenasFiltrados ? avisosFiltrados : avisos;
    const doc = new jsPDF({ orientation: 'portrait' });
    const margins = getAutoTableMargins();
    const pageWidth = doc.internal.pageSize.getWidth();

    let cursorY = getContentStartY();

    const agrupadosPdf = agruparValidacoes(errosExp, avisosExp);

    const metaItems: Array<[string, string]> = [
      ['Status', String(arquivo.status).toUpperCase()],
      ['Itens', `${errosExp.length + avisosExp.length}${apenasFiltrados ? ` (filtrados)` : ''}`],
      ['Categorias', String(agrupadosPdf.length)],
      ['Hash', arquivo.hash_sha256 ? `${arquivo.hash_sha256.slice(0, 12)}…` : '—'],
    ];
    const cardW = (pageWidth - margins.left - margins.right - 6) / metaItems.length;
    const cardH = 14;
    metaItems.forEach(([label, value], i) => {
      const x = margins.left + i * (cardW + 2);
      doc.setDrawColor(PDF_BRAND.border[0], PDF_BRAND.border[1], PDF_BRAND.border[2]);
      doc.setFillColor(PDF_BRAND.surface[0], PDF_BRAND.surface[1], PDF_BRAND.surface[2]);
      doc.roundedRect(x, cursorY, cardW, cardH, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(PDF_BRAND.muted[0], PDF_BRAND.muted[1], PDF_BRAND.muted[2]);
      doc.text(label.toUpperCase(), x + 2.5, cursorY + 4.5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(PDF_BRAND.foreground[0], PDF_BRAND.foreground[1], PDF_BRAND.foreground[2]);
      doc.text(value, x + 2.5, cursorY + 10.5);
    });
    cursorY += cardH + 6;

    autoTable(doc, {
      startY: cursorY,
      theme: 'plain',
      styles: {
        fontSize: 8.5,
        cellPadding: 1.5,
        textColor: [PDF_BRAND.foreground[0], PDF_BRAND.foreground[1], PDF_BRAND.foreground[2]],
      },
      body: [
        ['Empresa', arquivo.razao_social ?? '—'],
        ['CNPJ', arquivo.cnpj ?? '—'],
        [
          'Período',
          `${arquivo.periodo_inicio ?? `${arquivo.ano_calendario}-01-01`}  →  ${arquivo.periodo_fim ?? `${arquivo.ano_calendario}-12-31`}`,
        ],
        ['Tipo', `SPED ${arquivo.tipo}`],
        ['Ano-calendário', String(arquivo.ano_calendario)],
        [
          'Gerado em',
          arquivo.created_at
            ? new Date(arquivo.created_at).toLocaleString('pt-BR')
            : new Date().toLocaleString('pt-BR'),
        ],
        ['Gerado por', arquivo.gerado_por ?? '—'],
        ['Total lançamentos', String(arquivo.total_lancamentos ?? '—')],
        ['Total linhas', String(arquivo.total_linhas ?? '—')],
        ['Hash SHA-256', arquivo.hash_sha256 ?? '—'],
      ],
      columnStyles: {
        0: {
          fontStyle: 'bold',
          cellWidth: 42,
          textColor: [PDF_BRAND.muted[0], PDF_BRAND.muted[1], PDF_BRAND.muted[2]],
        },
      },
    });
    cursorY =
      (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY + 6 ||
      cursorY + 6;

    if (apenasFiltrados) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(PDF_BRAND.muted[0], PDF_BRAND.muted[1], PDF_BRAND.muted[2]);
      doc.text(`Filtro aplicado: "${busca.trim()}"`, margins.left, cursorY);
      cursorY += 5;
    }

    if (agrupadosPdf.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(PDF_BRAND.muted[0], PDF_BRAND.muted[1], PDF_BRAND.muted[2]);
      doc.text(
        apenasFiltrados
          ? `Nenhum item corresponde ao filtro "${busca.trim()}".`
          : 'Nenhum erro ou aviso encontrado.',
        margins.left,
        cursorY
      );
    } else {
      agrupadosPdf.forEach((grupo) => {
        autoTable(doc, {
          startY: cursorY,
          head: [
            [
              {
                content: `${grupo.categoria.label} (${grupo.total})`,
                styles: { halign: 'left' },
              },
            ],
          ],
          body: [
            ...grupo.erros.map((e) => [
              { content: `• ERROR: ${e}`, styles: { textColor: PDF_BRAND.destructive } },
            ]),
            ...grupo.avisos.map((a) => [
              { content: `• WARN: ${a}`, styles: { textColor: PDF_BRAND.warning } },
            ]),
          ],
          theme: 'striped',
          headStyles: {
            fillColor: [
              PDF_BRAND.foreground[0],
              PDF_BRAND.foreground[1],
              PDF_BRAND.foreground[2],
            ],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          styles: { fontSize: 7.5, cellPadding: 2, font: 'courier' },
          margin: margins,
        });
        cursorY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
      });
    }

    applyPdfLayout(doc, {
      titulo: `Validações SPED ${arquivo.tipo}`,
      subtitulo: `Ano-calendário ${arquivo.ano_calendario}${apenasFiltrados ? ' · filtrado' : ''}`,
      rodapeInfo: arquivo.hash_sha256
        ? `SHA-256 ${arquivo.hash_sha256.slice(0, 16)}…`
        : undefined,
    });

    doc.save(`${baseFilename}${apenasFiltrados ? '-filtrado' : ''}.pdf`);
    toast.success(
      apenasFiltrados
        ? `PDF exportado com ${errosExp.length} erro(s) e ${avisosExp.length} aviso(s) filtrados`
        : 'Validações exportadas em PDF'
    );
  } catch (e) {
    console.error(e);
    toast.error('Erro ao exportar PDF');
  }
}
