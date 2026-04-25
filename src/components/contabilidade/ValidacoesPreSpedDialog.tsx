import { useMemo, useState } from 'react';
import { Download, FileArchive, AlertTriangle, CheckCircle2, XCircle, ShieldAlert, Search, X, FileJson, FileText, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
        tipo: arquivo.tipo,
        ano_calendario: arquivo.ano_calendario,
        status: arquivo.status,
        hash_sha256: arquivo.hash_sha256,
        gerado_em: new Date().toISOString(),
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
      doc.setFontSize(14);
      doc.text(
        `Validações SPED ${arquivo.tipo} · ${arquivo.ano_calendario}${apenasFiltrados ? ' (filtrado)' : ''}`,
        14,
        16,
      );
      doc.setFontSize(9);
      const meta = [
        `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
        `Status: ${arquivo.status}`,
        `Hash: ${arquivo.hash_sha256 ?? '—'}`,
        apenasFiltrados
          ? `Filtro: "${busca.trim()}"  ·  Erros: ${errosExp.length}/${erros.length}  ·  Avisos: ${avisosExp.length}/${avisos.length}`
          : `Erros: ${erros.length}  ·  Avisos: ${avisos.length}`,
      ];
      meta.forEach((l, i) => doc.text(l, 14, 22 + i * 5));
      let cursorY = 22 + meta.length * 5 + 4;

      if (errosExp.length > 0) {
        autoTable(doc, {
          startY: cursorY,
          head: [[`Erros (${errosExp.length}${apenasFiltrados ? ` de ${erros.length}` : ''})`]],
          body: errosExp.map((e) => [e]),
          theme: 'striped',
          headStyles: { fillColor: [220, 38, 38] },
          styles: { fontSize: 8, cellPadding: 2 },
        });
        cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
      }

      if (avisosExp.length > 0) {
        autoTable(doc, {
          startY: cursorY,
          head: [[`Avisos (${avisosExp.length}${apenasFiltrados ? ` de ${avisos.length}` : ''})`]],
          body: avisosExp.map((a) => [a]),
          theme: 'striped',
          headStyles: { fillColor: [217, 119, 6] },
          styles: { fontSize: 8, cellPadding: 2 },
        });
      }

      if (errosExp.length === 0 && avisosExp.length === 0) {
        doc.text(
          apenasFiltrados
            ? `Nenhum item corresponde ao filtro "${busca.trim()}".`
            : 'Nenhum erro ou aviso encontrado.',
          14,
          cursorY,
        );
      }

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
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Validações SPED {arquivo.tipo} · {arquivo.ano_calendario}
          </DialogTitle>
          <DialogDescription>
            Revise erros e avisos antes de baixar e transmitir o arquivo no PVA-{arquivo.tipo}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-md border p-3 text-center">
            <div className="text-xs text-muted-foreground">Erros</div>
            <div
              data-testid="contador-erros"
              className={`text-2xl font-bold ${erros.length > 0 ? 'text-destructive' : 'text-success'}`}
            >
              {erros.length}
            </div>
          </div>
          <div className="rounded-md border p-3 text-center">
            <div className="text-xs text-muted-foreground">Avisos</div>
            <div
              data-testid="contador-avisos"
              className={`text-2xl font-bold ${avisos.length > 0 ? 'text-warning' : 'text-muted-foreground'}`}
            >
              {avisos.length}
            </div>
          </div>
          <div className="rounded-md border p-3 text-center">
            <div className="text-xs text-muted-foreground">Hash</div>
            <div className="text-xs font-mono mt-2 truncate" title={arquivo.hash_sha256 ?? ''}>
              {hashCurto}
            </div>
          </div>
        </div>

        {bloqueado && (
          <Alert variant="error" data-testid="banner-bloqueio">
            <XCircle className="h-4 w-4" />
            <AlertTitle>{isRejeitado ? 'Arquivo rejeitado pela transmissão' : 'Download bloqueado'}</AlertTitle>
            <AlertDescription>
              {isRejeitado
                ? `A transmissão deste SPED foi rejeitada${erros.length > 0 ? ` com ${erros.length} erro(s)` : ''}. Corrija as inconsistências e gere o arquivo novamente antes de retransmitir ao PVA.`
                : `Este SPED contém ${erros.length} erro(s) bloqueante(s). Corrija as inconsistências e gere o arquivo novamente antes de transmitir ao PVA.`}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue={erros.length > 0 ? 'erros' : 'avisos'}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="erros" className="gap-1.5">
              <XCircle className="h-3.5 w-3.5" />
              Erros
              <Badge variant={erros.length > 0 ? 'destructive' : 'outline'} className="ml-1">
                {erros.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="avisos" className="gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Avisos
              <Badge variant="outline" className="ml-1">
                {avisos.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {(erros.length > 0 || avisos.length > 0) && (
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                data-testid="input-busca-validacoes"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar nos erros e avisos..."
                className="h-8 pl-8 pr-8 text-xs"
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Limpar busca"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          <TabsContent value="erros">
            {erros.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-success p-4 justify-center">
                <CheckCircle2 className="h-4 w-4" /> Nenhum erro encontrado
              </div>
            ) : errosFiltrados.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 justify-center">
                <Search className="h-4 w-4" /> Nenhum erro corresponde a "{busca}"
              </div>
            ) : (
              <>
                {termo && (
                  <p className="text-[11px] text-muted-foreground px-1 pb-1">
                    {errosFiltrados.length} de {erros.length} erro(s)
                  </p>
                )}
                <ScrollArea className="max-h-72 border rounded-md p-3">
                  <ol data-testid="lista-erros" className="space-y-2 text-xs font-mono list-decimal list-inside">
                    {errosFiltrados.map((e, i) => (
                      <li key={i} className="text-destructive">
                        {e}
                      </li>
                    ))}
                  </ol>
                </ScrollArea>
              </>
            )}
          </TabsContent>

          <TabsContent value="avisos">
            {avisos.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 justify-center">
                <CheckCircle2 className="h-4 w-4" /> Nenhum aviso
              </div>
            ) : avisosFiltrados.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 justify-center">
                <Search className="h-4 w-4" /> Nenhum aviso corresponde a "{busca}"
              </div>
            ) : (
              <>
                {termo && (
                  <p className="text-[11px] text-muted-foreground px-1 pb-1">
                    {avisosFiltrados.length} de {avisos.length} aviso(s)
                  </p>
                )}
                <ScrollArea className="max-h-72 border rounded-md p-3">
                  <ol data-testid="lista-avisos" className="space-y-2 text-xs font-mono list-decimal list-inside">
                    {avisosFiltrados.map((a, i) => (
                      <li key={i} className="text-warning">
                        {a}
                      </li>
                    ))}
                  </ol>
                </ScrollArea>
              </>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                data-testid="btn-exportar-validacoes"
                disabled={erros.length === 0 && avisos.length === 0}
                className="gap-2"
              >
                <FileDown className="h-4 w-4" />
                Exportar validações
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs">
                Relatório de validações
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportarPdf} className="gap-2">
                <FileText className="h-4 w-4 text-destructive" />
                PDF (.pdf)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportarJson} className="gap-2">
                <FileJson className="h-4 w-4 text-primary" />
                JSON (.json)
              </DropdownMenuItem>
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
