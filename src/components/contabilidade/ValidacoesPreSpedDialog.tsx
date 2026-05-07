import { useMemo, useState, useEffect } from 'react';
import { Download, FileArchive, AlertTriangle, CheckCircle2, XCircle, ShieldAlert, Search, X, FileJson, FileText, FileDown, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  applyPdfLayout,
  getAutoTableMargins,
  getContentStartY,
  PDF_BRAND,
} from '@/lib/pdf-layout';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { agruparValidacoes, type ValidacoesAgrupadas } from '@/lib/sped-validacoes-categorias';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface ValidacoesPreSpedArquivo {
  tipo: 'ECD' | 'ECF';
  ano_calendario: number;
  hash_sha256: string | null;
  status: string;
  validacoes: { erros: string[]; avisos: string[] };
  /** Metadados autoexplicativos do arquivo */
  cnpj?: string;
  razao_social?: string;
  periodo_inicio?: string;
  periodo_fim?: string;
  gerado_por?: string | null;
  created_at?: string;
  total_lancamentos?: number | null;
  total_linhas?: number | null;
}


interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  arquivo: ValidacoesPreSpedArquivo | null;
  onDownloadTxt: () => void;
  onDownloadZip: () => void;
}

export function ValidacoesPreSpedDialog({ open, onOpenChange, arquivo, onDownloadTxt, onDownloadZip }: Props) {
  const [busca, setBusca] = useState('');
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const erros = arquivo?.validacoes?.erros ?? [];
  const avisos = arquivo?.validacoes?.avisos ?? [];
  const isRejeitado = arquivo?.status === 'rejeitado';
  const bloqueado = erros.length > 0 || isRejeitado;
  const hashCurto = arquivo?.hash_sha256 ? `${arquivo.hash_sha256.slice(0, 12)}…` : '—';

  const termo = busca.trim().toLowerCase();
  const errosFiltrados = useMemo(
    () => (termo ? erros.filter((e) => e.toLowerCase().includes(termo)) : erros),
    [erros, termo],
  );
  const avisosFiltrados = useMemo(
    () => (termo ? avisos.filter((a) => a.toLowerCase().includes(termo)) : avisos),
    [avisos, termo],
  );

  const toggleCategoria = (id: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const agrupados = useMemo(() => {
    return agruparValidacoes(errosFiltrados, avisosFiltrados);
  }, [errosFiltrados, avisosFiltrados]);

  // Expandir automaticamente se houver busca ou se houver poucos grupos
  useEffect(() => {
    if (busca.trim() || agrupados.length <= 2) {
      setExpandedCats(new Set(agrupados.map(a => a.categoria.id)));
    }
  }, [busca, agrupados]);

  if (!arquivo) return null;

  const handleDownloadTxt = () => {
    if (bloqueado) return;
    onDownloadTxt();
    onOpenChange(false);
  };

  const handleDownloadZip = () => {
    if (bloqueado) return;
    onDownloadZip();
  };

  const baseFilename = `validacoes-sped-${arquivo.tipo.toLowerCase()}-${arquivo.ano_calendario}-${new Date().toISOString().slice(0, 10)}`;

  const temFiltro = termo.length > 0;
  const podeExportarFiltrado =
    temFiltro && (errosFiltrados.length > 0 || avisosFiltrados.length > 0);

  const exportarJson = (apenasFiltrados = false) => {
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
          : 'Validações exportadas em JSON',
      );
    } catch (e) {
      console.error(e);
      toast.error('Erro ao exportar JSON');
    }
  };

  const exportarPdf = (apenasFiltrados = false) => {
    try {
      const errosExp = apenasFiltrados ? errosFiltrados : erros;
      const avisosExp = apenasFiltrados ? avisosFiltrados : avisos;
      const doc = new jsPDF({ orientation: 'portrait' });
      const margins = getAutoTableMargins();
      const pageWidth = doc.internal.pageSize.getWidth();

      let cursorY = getContentStartY();

      // Agrupar por categoria para o PDF
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
        doc.setTextColor(
          PDF_BRAND.foreground[0],
          PDF_BRAND.foreground[1],
          PDF_BRAND.foreground[2],
        );
        doc.text(value, x + 2.5, cursorY + 10.5);
      });
      cursorY += cardH + 6;

      // Bloco de metadados do arquivo (autoexplicativo)
      autoTable(doc, {
        startY: cursorY,
        theme: 'plain',
        styles: { fontSize: 8.5, cellPadding: 1.5, textColor: [PDF_BRAND.foreground[0], PDF_BRAND.foreground[1], PDF_BRAND.foreground[2]] },
        body: [
          ['Empresa', arquivo.razao_social ?? '—'],
          ['CNPJ', arquivo.cnpj ?? '—'],
          ['Período', `${arquivo.periodo_inicio ?? `${arquivo.ano_calendario}-01-01`}  →  ${arquivo.periodo_fim ?? `${arquivo.ano_calendario}-12-31`}`],
          ['Tipo', `SPED ${arquivo.tipo}`],
          ['Ano-calendário', String(arquivo.ano_calendario)],
          ['Gerado em', arquivo.created_at ? new Date(arquivo.created_at).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR')],
          ['Gerado por', arquivo.gerado_por ?? '—'],
          ['Total lançamentos', String(arquivo.total_lancamentos ?? '—')],
          ['Total linhas', String(arquivo.total_linhas ?? '—')],
          ['Hash SHA-256', arquivo.hash_sha256 ?? '—'],
        ],
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 42, textColor: [PDF_BRAND.muted[0], PDF_BRAND.muted[1], PDF_BRAND.muted[2]] },
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cursorY = (doc as any).lastAutoTable?.finalY + 6 || cursorY + 6;

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
          cursorY,
        );
      } else {
        agrupadosPdf.forEach((grupo) => {
          autoTable(doc, {
            startY: cursorY,
            head: [[{ content: `${grupo.categoria.label} (${grupo.total})`, styles: { halign: 'left' } }]],
            body: [
              ...grupo.erros.map(e => [{ content: `• ERROR: ${e}`, styles: { textColor: PDF_BRAND.destructive } }]),
              ...grupo.avisos.map(a => [{ content: `• WARN: ${a}`, styles: { textColor: PDF_BRAND.warning } }])
            ],
            theme: 'striped',
            headStyles: {
              fillColor: [PDF_BRAND.foreground[0], PDF_BRAND.foreground[1], PDF_BRAND.foreground[2]],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
            },
            styles: { fontSize: 7.5, cellPadding: 2, font: 'courier' },
            margin: margins,
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cursorY = (doc as any).lastAutoTable.finalY + 6;
        });
      }

      applyPdfLayout(doc, {
        titulo: `Validações SPED ${arquivo.tipo}`,
        subtitulo: `Ano-calendário ${arquivo.ano_calendario}${apenasFiltrados ? ' · filtrado' : ''}`,
        rodapeInfo: arquivo.hash_sha256 ? `SHA-256 ${arquivo.hash_sha256.slice(0, 16)}…` : undefined,
      });

      doc.save(`${baseFilename}${apenasFiltrados ? '-filtrado' : ''}.pdf`);
      toast.success(
        apenasFiltrados
          ? `PDF exportado com ${errosExp.length} erro(s) e ${avisosExp.length} aviso(s) filtrados`
          : 'Validações exportadas em PDF',
      );
    } catch (e) {
      console.error(e);
      toast.error('Erro ao exportar PDF');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShieldAlert className="h-6 w-6 text-primary" />
            </div>
            Validações SPED {arquivo.tipo} · {arquivo.ano_calendario}
          </DialogTitle>
          <DialogDescription className="text-xs font-medium">
            Revise erros e avisos antes de baixar e transmitir o arquivo no PVA-{arquivo.tipo}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border bg-muted/20 p-4 text-center transition-all hover:bg-muted/30">
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Erros</div>
            <div
              data-testid="contador-erros"
              className={cn("text-3xl font-black tabular-nums", erros.length > 0 ? 'text-destructive' : 'text-success')}
            >
              {erros.length}
            </div>
          </div>
          <div className="rounded-xl border bg-muted/20 p-4 text-center transition-all hover:bg-muted/30">
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Avisos</div>
            <div
              data-testid="contador-avisos"
              className={cn("text-3xl font-black tabular-nums", avisos.length > 0 ? 'text-warning' : 'text-muted-foreground')}
            >
              {avisos.length}
            </div>
          </div>
          <div className="rounded-xl border bg-muted/20 p-4 text-center transition-all hover:bg-muted/30 flex flex-col justify-center overflow-hidden">
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Hash</div>
            <div className="text-[10px] font-mono mt-1 truncate bg-background/50 p-1.5 rounded border" title={arquivo.hash_sha256 ?? ''}>
              {hashCurto}
            </div>
          </div>
        </div>

        {bloqueado && (
          <Alert variant="error" className="bg-destructive/5 border-destructive/20 shadow-sm" data-testid="banner-bloqueio">
            <XCircle className="h-4 w-4 text-destructive" />
            <AlertTitle className="font-bold text-destructive">{isRejeitado ? 'ARQUIVO REJEITADO PELA TRANSMISSÃO' : 'DOWNLOAD BLOQUEADO'}</AlertTitle>
            <AlertDescription className="text-xs">
              {isRejeitado
                ? `A transmissão deste SPED foi rejeitada${erros.length > 0 ? ` com ${erros.length} erro(s)` : ''}. Corrija as inconsistências e gere o arquivo novamente antes de retransmitir ao PVA.`
                : `Este SPED contém ${erros.length} erro(s) bloqueante(s). Corrija as inconsistências e gere o arquivo novamente antes de transmitir ao PVA.`}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between mb-2 gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary pointer-events-none" />
            <Input
              data-testid="input-busca-validacoes"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar nas validações (ex: código de conta, descrição)..."
              className="h-10 pl-10 pr-10 text-xs bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/50 transition-all rounded-xl"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-[50vh] pr-4">
          {agrupados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 text-success/20 mb-3" />
              <p className="text-sm font-medium">Nenhuma validação pendente</p>
              {busca && <p className="text-xs">Nenhum item corresponde a "{busca}"</p>}
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {agrupados.map(({ categoria, erros: catErros, avisos: catAvisos, total }) => {
                const isOpen = expandedCats.has(categoria.id);
                return (
                  <div key={categoria.id} className={cn("border rounded-2xl overflow-hidden transition-all duration-300 shadow-sm", isOpen ? "bg-card border-primary/20 ring-1 ring-primary/5" : "bg-card/50 hover:border-primary/20")}>
                    <button
                      onClick={() => toggleCategoria(categoria.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-3 rounded-xl transition-all shadow-sm",
                          catErros.length > 0 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning",
                          isOpen && (catErros.length > 0 ? "bg-destructive text-white" : "bg-warning text-white")
                        )}>
                          {catErros.length > 0 ? <XCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="text-sm font-black flex items-center gap-2 tracking-tight">
                            {categoria.label.toUpperCase()}
                            <Badge variant="secondary" className="text-[10px] h-5 px-2 font-black rounded-full bg-muted/50">
                              {total}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-70">{categoria.description}</p>
                        </div>
                      </div>
                      <div className={cn("p-1.5 rounded-full transition-all", isOpen ? "bg-primary/10 text-primary" : "text-muted-foreground")}>
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>
                    </button>
                    
                    {isOpen && (
                      <div className="p-4 pt-0 space-y-2 bg-gradient-to-b from-transparent to-muted/5">
                        {catErros.map((e, i) => (
                          <div key={`e-${i}`} className="flex gap-3 text-xs font-mono p-3 rounded-xl bg-destructive/5 text-destructive border border-destructive/10 leading-relaxed shadow-sm transition-all hover:bg-destructive/10">
                            <span className="shrink-0 opacity-40 font-bold">ERR</span>
                            <span>{e}</span>
                          </div>
                        ))}
                        {catAvisos.map((a, i) => (
                          <div key={`a-${i}`} className="flex gap-3 text-xs font-mono p-3 rounded-xl bg-warning/5 text-warning-foreground border border-warning/10 leading-relaxed shadow-sm transition-all hover:bg-warning/10">
                            <span className="shrink-0 opacity-40 font-bold">WRN</span>
                            <span>{a}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>


        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <div className="h-6 w-px bg-border mx-2 hidden sm:block" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                data-testid="btn-exportar-validacoes"
                disabled={erros.length === 0 && avisos.length === 0}
                className="gap-2 font-bold shadow-sm"
              >
                <FileDown className="h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest opacity-50 px-2 py-1">Relatório Completo</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => exportarPdf(false)} className="gap-3 py-2 rounded-lg cursor-pointer">
                <div className="p-1.5 bg-destructive/10 rounded-md">
                  <FileText className="h-4 w-4 text-destructive" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold">PDF (.pdf)</span>
                  <span className="text-[10px] text-muted-foreground">{erros.length + avisos.length} item(ns)</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportarJson(false)} className="gap-3 py-2 rounded-lg cursor-pointer">
                <div className="p-1.5 bg-primary/10 rounded-md">
                  <FileJson className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold">JSON (.json)</span>
                  <span className="text-[10px] text-muted-foreground">{erros.length + avisos.length} item(ns)</span>
                </div>
              </DropdownMenuItem>
              {temFiltro && (
                <>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-widest opacity-50 px-2 py-1">
                    Apenas Filtrados
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => exportarPdf(true)}
                    disabled={!podeExportarFiltrado}
                    data-testid="btn-exportar-pdf-filtrado"
                    className="gap-3 py-2 rounded-lg cursor-pointer"
                  >
                    <div className="p-1.5 bg-destructive/10 rounded-md">
                      <FileText className="h-4 w-4 text-destructive" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">PDF Filtrado</span>
                      <span className="text-[10px] text-muted-foreground">{errosFiltrados.length + avisosFiltrados.length} item(ns)</span>
                    </div>
                  </DropdownMenuItem>
                  >
                    <FileText className="h-4 w-4 text-destructive" />
                    PDF filtrado
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {errosFiltrados.length + avisosFiltrados.length} item(ns)
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => exportarJson(true)}
                    disabled={!podeExportarFiltrado}
                    data-testid="btn-exportar-json-filtrado"
                    className="gap-2"
                  >
                    <FileJson className="h-4 w-4 text-primary" />
                    JSON filtrado
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {errosFiltrados.length + avisosFiltrados.length} item(ns)
                    </span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    onClick={handleDownloadZip}
                    disabled={bloqueado}
                    aria-disabled={bloqueado}
                    data-testid="btn-download-zip"
                  >
                    <FileArchive className="h-4 w-4 mr-2" />
                    Baixar .zip
                  </Button>
                </span>
              </TooltipTrigger>
              {bloqueado && <TooltipContent>{isRejeitado ? 'Bloqueado: arquivo rejeitado' : 'Bloqueado por erros de validação'}</TooltipContent>}
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    onClick={handleDownloadTxt}
                    disabled={bloqueado}
                    aria-disabled={bloqueado}
                    data-testid="btn-download-txt"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar .txt
                  </Button>
                </span>
              </TooltipTrigger>
              {bloqueado && <TooltipContent>{isRejeitado ? 'Bloqueado: arquivo rejeitado' : 'Bloqueado por erros de validação'}</TooltipContent>}
            </Tooltip>
          </TooltipProvider>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
