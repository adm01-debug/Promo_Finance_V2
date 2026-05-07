import { useState } from 'react';
import { Download, Loader2, FileText, FileJson, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '@/lib/formatters';
import {
  applyPdfLayout,
  getAutoTableMargins,
  getContentStartY,
  PDF_BRAND,
} from '@/lib/pdf-layout';

interface DRELinha {
  codigo: string;
  descricao: string;
  valor: number;
  percentual: number;
  nivel: number;
  tipo: string;
}

interface ResumoBalanco {
  totalAtivo: number;
  totalPassivo: number;
  equilibrado: boolean;
}

interface ResumoDRE {
  receitaLiquida?: number;
  lucroLiquido: number;
}

export interface ExportDemonstrativoPDFProps {
  tipo: 'dre' | 'balanco' | 'fluxo';
  periodo: string;
  mes: number;
  ano: number;
  empresa: string;
  linhas: DRELinha[];
  resumoBalanco?: ResumoBalanco;
  resumoDRE?: ResumoDRE;
  fonte?: 'competencia' | 'caixa';
}

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const TIPO_LABELS: Record<string, string> = {
  dre: 'Demonstração do Resultado do Exercício (DRE)',
  balanco: 'Balanço Patrimonial',
  fluxo: 'Demonstração de Fluxo de Caixa (DFC)',
};

function buildMetadata(props: ExportDemonstrativoPDFProps) {
  return {
    tipo: props.tipo,
    titulo: TIPO_LABELS[props.tipo] ?? props.tipo.toUpperCase(),
    empresa: props.empresa,
    periodo: props.periodo,
    mes: props.mes,
    mes_nome: MESES[props.mes],
    ano: props.ano,
    fonte: props.fonte ?? 'competencia',
    fonte_label: (props.fonte ?? 'competencia') === 'competencia' ? 'Regime de Competência' : 'Regime de Caixa',
    gerado_em: new Date().toISOString(),
  };
}

function buildFilename(props: ExportDemonstrativoPDFProps, ext: string) {
  return `${props.tipo.toUpperCase()}_${MESES[props.mes]}_${props.ano}_${props.fonte ?? 'competencia'}.${ext}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ExportDemonstrativoPDF(props: ExportDemonstrativoPDFProps) {
  const { tipo, mes, ano, empresa, linhas, resumoBalanco, resumoDRE, fonte = 'competencia' } = props;
  const [exporting, setExporting] = useState(false);

  const exportJSON = () => {
    try {
      const meta = buildMetadata(props);
      const payload: Record<string, unknown> = {
        ...meta,
        linhas: linhas.map((l) => ({
          codigo: l.codigo,
          descricao: l.descricao,
          valor: l.valor,
          percentual: l.percentual,
          nivel: l.nivel,
          tipo: l.tipo,
        })),
      };
      if (tipo === 'dre' && resumoDRE) {
        payload.resumo = { lucro_liquido: resumoDRE.lucroLiquido, receita_liquida: resumoDRE.receitaLiquida ?? null };
      }
      if (tipo === 'balanco' && resumoBalanco) {
        payload.resumo = {
          total_ativo: resumoBalanco.totalAtivo,
          total_passivo: resumoBalanco.totalPassivo,
          equilibrado: resumoBalanco.equilibrado,
          diferenca: resumoBalanco.totalAtivo - resumoBalanco.totalPassivo,
        };
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      downloadBlob(blob, buildFilename(props, 'json'));
      toast.success(`${TIPO_LABELS[tipo]} exportado em JSON`);
    } catch {
      toast.error('Erro ao exportar JSON');
    }
  };

  const exportPDF = () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      const margins = getAutoTableMargins();
      let cursorY = getContentStartY();

      // Metadata cards row
      const metaItems: [string, string][] = [
        ['Empresa', empresa],
        ['Período', `${MESES[mes]} / ${ano}`],
        ['Regime', fonte === 'competencia' ? 'Competência' : 'Caixa'],
      ];
      if (tipo === 'dre' && resumoDRE) {
        metaItems.push(['Resultado', `${resumoDRE.lucroLiquido >= 0 ? 'Lucro' : 'Prejuízo'} ${formatCurrency(Math.abs(resumoDRE.lucroLiquido))}`]);
      }
      if (tipo === 'balanco' && resumoBalanco) {
        metaItems.push([resumoBalanco.equilibrado ? 'Equilíbrio' : 'Diferença', resumoBalanco.equilibrado ? 'Equilibrado' : formatCurrency(resumoBalanco.totalAtivo - resumoBalanco.totalPassivo)]);
      }
      const cardW = (doc.internal.pageSize.getWidth() - margins.left - margins.right - (metaItems.length - 1) * 2) / metaItems.length;
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
        doc.setFontSize(9);
        doc.setTextColor(PDF_BRAND.foreground[0], PDF_BRAND.foreground[1], PDF_BRAND.foreground[2]);
        const maxW = cardW - 5;
        doc.text(value, x + 2.5, cursorY + 10.5, { maxWidth: maxW });
      });
      cursorY += cardH + 6;

      // Summary block for balanço
      if (tipo === 'balanco' && resumoBalanco) {
        const ok = resumoBalanco.equilibrado;
        const accent: [number, number, number] = ok ? PDF_BRAND.success : PDF_BRAND.destructive;
        autoTable(doc, {
          startY: cursorY,
          theme: 'plain',
          styles: { fontSize: 9, cellPadding: 2.5 },
          body: [
            ['Ativo Total', formatCurrency(resumoBalanco.totalAtivo)],
            ['Passivo + PL', formatCurrency(resumoBalanco.totalPassivo)],
            ['Diferença', formatCurrency(resumoBalanco.totalAtivo - resumoBalanco.totalPassivo)],
            ['Status', ok ? 'EQUILIBRADO' : 'DESEQUILIBRADO'],
          ],
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 55, textColor: [PDF_BRAND.muted[0], PDF_BRAND.muted[1], PDF_BRAND.muted[2]] },
            1: { halign: 'right' as const, textColor: [accent[0], accent[1], accent[2]] },
          },
          margin: margins,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cursorY = (doc as any).lastAutoTable?.finalY + 4 || cursorY + 4;
      }

      // Main table
      autoTable(doc, {
        startY: cursorY,
        head: [['Código', 'Descrição', 'Valor (R$)', 'AV (%)']],
        body: linhas.map((l) => [
          l.codigo,
          (l.nivel === 1 ? '  ' : '') + l.descricao,
          formatCurrency(Math.abs(l.valor)),
          l.percentual.toFixed(1) + '%',
        ]),
        styles: { fontSize: 8, cellPadding: 2.5, textColor: [PDF_BRAND.foreground[0], PDF_BRAND.foreground[1], PDF_BRAND.foreground[2]] },
        headStyles: {
          fillColor: [PDF_BRAND.primary[0], PDF_BRAND.primary[1], PDF_BRAND.primary[2]],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: { fillColor: [PDF_BRAND.surface[0], PDF_BRAND.surface[1], PDF_BRAND.surface[2]] },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 85 },
          2: { halign: 'right' as const, cellWidth: 40 },
          3: { halign: 'right' as const, cellWidth: 25 },
        },
        didParseCell: (data) => {
          if (data.section === 'body') {
            const linha = linhas[data.row.index];
            if (linha && linha.nivel === 0) data.cell.styles.fontStyle = 'bold';
            if (linha && linha.codigo === '11') {
              data.cell.styles.fillColor = [PDF_BRAND.primary[0], PDF_BRAND.primary[1], PDF_BRAND.primary[2]];
              data.cell.styles.textColor = [255, 255, 255];
              data.cell.styles.fontStyle = 'bold';
            }
            if (linha && linha.codigo === '99') {
              data.cell.styles.fillColor = [255, 248, 230];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
        margin: margins,
      });

      applyPdfLayout(doc, {
        titulo: TIPO_LABELS[tipo] ?? tipo.toUpperCase(),
        subtitulo: `${MESES[mes]} ${ano} · ${fonte === 'competencia' ? 'Competência' : 'Caixa'}`,
      });

      doc.save(buildFilename(props, 'pdf'));
      toast.success(`${TIPO_LABELS[tipo]} exportado em PDF`);
    } catch {
      toast.error('Erro ao exportar PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exporting} className="gap-2 h-9 rounded-xl border-border/50 bg-background/50 hover:bg-accent/50 hover:text-primary transition-all duration-300 shadow-sm active:scale-95">
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs">Exportar {TIPO_LABELS[tipo]?.split('(')[0]?.trim()}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportPDF} className="gap-2">
          <FileText className="h-4 w-4 text-destructive" />
          PDF (.pdf)
          <span className="ml-auto text-[10px] text-muted-foreground">
            {linhas.length} linhas
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportJSON} className="gap-2">
          <FileJson className="h-4 w-4 text-primary" />
          JSON (.json)
          <span className="ml-auto text-[10px] text-muted-foreground">
            {linhas.length} linhas
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
