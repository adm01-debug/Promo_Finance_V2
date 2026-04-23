import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Download, FileText, AlertTriangle, CheckCircle2, ShieldAlert, FileArchive, Wand2, Send, FileSearch, ChevronDown, ChevronRight, ScrollText, XCircle, Hash, Lock, Unlock, Loader2, Clock, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useSpedContabilHistorico, useRegistrarTransmissaoSped, useGerarSpedContabil } from '@/hooks/useSpedContabil';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SpedEcdWizard } from './SpedEcdWizard';
import { SpedEcfWizard } from './SpedEcfWizard';
import { SpedEcfHistorico } from './SpedEcfHistorico';
import { SpedEcdPreviewDialog } from './SpedEcdPreviewDialog';
import { ValidacoesPreSpedDialog, type ValidacoesPreSpedArquivo } from './ValidacoesPreSpedDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { baixarSpedZip } from '@/lib/sped-zip';

interface Props {
  tipo: 'ECD' | 'ECF';
  empresaId?: string;
}

interface HistoricoRow {
  id: string;
  ano_calendario: number;
  created_at: string;
  total_lancamentos: number;
  total_linhas: number;
  status: string;
  hash_sha256: string | null;
  storage_path: string;
  recibo_transmissao: string | null;
  validacoes: { erros: string[]; avisos: string[] };
  tipo: string;
}

const DRAFT_KEY = (tipo: 'ECD' | 'ECF', empresaId?: string) =>
  `sped-wizard-draft:${tipo}:${empresaId || '_'}`;

export function SpedContabilTab({ tipo, empresaId }: Props) {
  const [ano, setAno] = useState(() => {
    if (typeof window === 'undefined') return new Date().getFullYear() - 1;
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY(tipo, empresaId));
      if (raw) {
        const parsed = JSON.parse(raw) as { ano?: number };
        if (typeof parsed.ano === 'number' && parsed.ano >= 2010) return parsed.ano;
      }
    } catch { /* noop */ }
    return new Date().getFullYear() - 1;
  });
  const [rascunhoRestaurado, setRascunhoRestaurado] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [transmissaoArquivo, setTransmissaoArquivo] = useState<HistoricoRow | null>(null);
  const [validacoesArquivo, setValidacoesArquivo] = useState<HistoricoRow | null>(null);
  const [reciboInput, setReciboInput] = useState('');
  const [expandedAudit, setExpandedAudit] = useState<Set<string>>(new Set());
  const [exportStatus, setExportStatus] = useState<'idle' | 'queued' | 'processing' | 'done' | 'error'>('idle');
  const transmitir = useRegistrarTransmissaoSped();
  const gerarSped = useGerarSpedContabil();
  const { data: historico = [], isLoading } = useSpedContabilHistorico(empresaId);
  const historicoTipo = (historico as unknown as HistoricoRow[]).filter((h) => h.tipo === tipo);

  const handleGerarExportar = async () => {
    if (!empresaId) return;
    setExportStatus('queued');
    // breve estado "em fila" para feedback visual antes da chamada
    await new Promise((r) => setTimeout(r, 350));
    setExportStatus('processing');
    try {
      await gerarSped.mutateAsync({ empresaId, anoCalendario: ano, tipo });
      setExportStatus('done');
      setTimeout(() => setExportStatus('idle'), 4000);
    } catch {
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 5000);
    }
  };

  const exportButton = (() => {
    const base = 'flex-1';
    switch (exportStatus) {
      case 'queued':
        return { icon: <Clock className="mr-2 h-4 w-4" />, label: 'Em fila…', disabled: true, variant: 'secondary' as const, className: cn(base, 'bg-muted text-muted-foreground') };
      case 'processing':
        return { icon: <Loader2 className="mr-2 h-4 w-4 animate-spin" />, label: 'Processando…', disabled: true, variant: 'secondary' as const, className: cn(base, 'bg-primary/10 text-primary') };
      case 'done':
        return { icon: <CheckCircle2 className="mr-2 h-4 w-4" />, label: 'Concluído', disabled: false, variant: 'default' as const, className: cn(base, 'bg-success hover:bg-success text-white') };
      case 'error':
        return { icon: <AlertTriangle className="mr-2 h-4 w-4" />, label: 'Falhou — tentar novamente', disabled: false, variant: 'destructive' as const, className: base };
      default:
        return { icon: <PlayCircle className="mr-2 h-4 w-4" />, label: `Gerar/Exportar SPED ${tipo}`, disabled: false, variant: 'default' as const, className: base };
    }
  })();

  const toggleAudit = (id: string) => {
    setExpandedAudit((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const copyHash = async (hash: string | null) => {
    if (!hash) return;
    try {
      await navigator.clipboard.writeText(hash);
      toast.success('Hash copiado');
    } catch { toast.error('Falha ao copiar'); }
  };

  // Re-hidrata o ano ao trocar de empresa/tipo
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY(tipo, empresaId));
      if (raw) {
        const parsed = JSON.parse(raw) as { ano?: number };
        if (typeof parsed.ano === 'number' && parsed.ano >= 2010) {
          setAno(parsed.ano);
          setRascunhoRestaurado(true);
          const t = setTimeout(() => setRascunhoRestaurado(false), 4000);
          return () => clearTimeout(t);
        }
      }
    } catch { /* noop */ }
  }, [tipo, empresaId]);

  // Persiste o ano sempre que mudar
  useEffect(() => {
    if (typeof window === 'undefined' || !empresaId) return;
    try {
      window.localStorage.setItem(
        DRAFT_KEY(tipo, empresaId),
        JSON.stringify({ ano, ts: Date.now() }),
      );
    } catch { /* noop */ }
  }, [ano, tipo, empresaId]);


  const handleDownload = async (storage_path: string) => {
    const { data, error } = await supabase.storage.from('relatorios-tributarios').createSignedUrl(storage_path, 60 * 60);
    if (error || !data) { toast.error('Falha ao gerar link'); return; }
    window.open(data.signedUrl, '_blank');
  };

  const handleDownloadZip = async (h: HistoricoRow) => {
    const { data, error } = await supabase.storage.from('relatorios-tributarios').createSignedUrl(h.storage_path, 60 * 60);
    if (error || !data) { toast.error('Falha ao gerar link'); return; }
    const fileName = h.storage_path.split('/').pop() || `${tipo}-${h.ano_calendario}.txt`;
    try {
      await baixarSpedZip({
        txtUrl: data.signedUrl, fileName, hash: h.hash_sha256 || 'N/A',
        empresa: { razao_social: '—', cnpj: '—' },
        periodo: { inicio: `${h.ano_calendario}-01-01`, fim: `${h.ano_calendario}-12-31` },
        totalLinhas: h.total_linhas, totalLancamentos: h.total_lancamentos,
        tipo,
      });
      toast.success('ZIP baixado');
    } catch (e) {
      toast.error(`Falha: ${e instanceof Error ? e.message : 'erro'}`);
    }
  };

  const handleConfirmarTransmissao = async () => {
    if (!transmissaoArquivo || !reciboInput.trim()) return;
    await transmitir.mutateAsync({ arquivoId: transmissaoArquivo.id, recibo: reciboInput.trim(), tipo });
    setTransmissaoArquivo(null);
    setReciboInput('');
  };

  return (
    <div className="space-y-6">
      {tipo === 'ECD' && empresaId && (
        <>
          <SpedEcdWizard open={wizardOpen} onOpenChange={setWizardOpen} empresaId={empresaId} anoCalendario={ano} />
          <SpedEcdPreviewDialog
            open={previewOpen}
            onOpenChange={setPreviewOpen}
            empresaId={empresaId}
            anoCalendario={ano}
            onAbrirWizard={() => setWizardOpen(true)}
          />
        </>
      )}
      {tipo === 'ECF' && empresaId && (
        <SpedEcfWizard open={wizardOpen} onOpenChange={setWizardOpen} empresaId={empresaId} anoCalendario={ano} />
      )}

      <ValidacoesPreSpedDialog
        open={!!validacoesArquivo}
        onOpenChange={(v) => { if (!v) setValidacoesArquivo(null); }}
        arquivo={validacoesArquivo ? {
          tipo: validacoesArquivo.tipo as 'ECD' | 'ECF',
          ano_calendario: validacoesArquivo.ano_calendario,
          hash_sha256: validacoesArquivo.hash_sha256,
          status: validacoesArquivo.status,
          validacoes: validacoesArquivo.validacoes ?? { erros: [], avisos: [] },
        } satisfies ValidacoesPreSpedArquivo : null}
        onDownloadTxt={() => validacoesArquivo && handleDownload(validacoesArquivo.storage_path)}
        onDownloadZip={() => validacoesArquivo && handleDownloadZip(validacoesArquivo)}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerar SPED {tipo}
          </CardTitle>
          <CardDescription>
            {tipo === 'ECD'
              ? 'Escrituração Contábil Digital — Layout 9 (livro Diário)'
              : 'Escrituração Contábil Fiscal — Layout 10 (LALUR/LACS, IRPJ/CSLL)'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Ano-calendário</Label>
                {rascunhoRestaurado && (
                  <Badge variant="secondary" className="text-[10px] font-normal animate-fade-in">
                    Rascunho restaurado
                  </Badge>
                )}
              </div>
              <Input type="number" min={2010} max={new Date().getFullYear()} value={ano}
                onChange={e => setAno(Number(e.target.value))} />
            </div>
            <div className="md:col-span-2 flex items-end gap-2">
              {tipo === 'ECD' && (
                <Button
                  disabled={!empresaId}
                  variant="outline"
                  onClick={() => setPreviewOpen(true)}
                  className="flex-1"
                >
                  <FileSearch className="mr-2 h-4 w-4" />
                  Pré-visualizar
                </Button>
              )}
              <Button disabled={!empresaId} variant="outline" onClick={() => setWizardOpen(true)} className="flex-1">
                <Wand2 className="mr-2 h-4 w-4" />
                Abrir wizard · {ano}
              </Button>
              <Button
                disabled={!empresaId || exportButton.disabled}
                onClick={handleGerarExportar}
                variant={exportButton.variant}
                className={exportButton.className}
              >
                {exportButton.icon}
                {exportButton.label}
              </Button>
            </div>
          </div>

          {exportStatus !== 'idle' && (
            <div
              className={cn(
                'flex items-center gap-2 rounded-md border px-3 py-2 text-xs animate-fade-in',
                exportStatus === 'queued' && 'border-muted-foreground/20 bg-muted/30 text-muted-foreground',
                exportStatus === 'processing' && 'border-primary/30 bg-primary/5 text-primary',
                exportStatus === 'done' && 'border-success/30 bg-success/5 text-success',
                exportStatus === 'error' && 'border-destructive/30 bg-destructive/5 text-destructive',
              )}
            >
              {exportStatus === 'queued' && <><Clock className="h-3.5 w-3.5" /><span>Em fila — preparando geração do SPED {tipo} para o ano {ano}.</span></>}
              {exportStatus === 'processing' && <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span>Processando — gerando arquivo SPED {tipo} ({ano}). Isso pode levar alguns segundos.</span></>}
              {exportStatus === 'done' && <><CheckCircle2 className="h-3.5 w-3.5" /><span>Concluído — arquivo disponível no histórico abaixo e aberto em nova aba.</span></>}
              {exportStatus === 'error' && <><AlertTriangle className="h-3.5 w-3.5" /><span>Falha na geração — verifique o histórico para detalhes ou tente novamente.</span></>}
            </div>
          )}

          <Alert variant="warning" title="Arquivo preliminar">
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Sempre valide no PVA-{tipo} da Receita Federal antes da transmissão oficial.
                {tipo === 'ECF' && ' A ECF requer ECD do mesmo período já gerada.'}
              </span>
            </div>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de gerações</CardTitle>
          <CardDescription>Arquivos {tipo} gerados anteriormente</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : historicoTipo.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum arquivo gerado ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Gerado em</TableHead>
                  <TableHead>Lançamentos</TableHead>
                  <TableHead>Linhas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recibo</TableHead>
                  <TableHead>Hash</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historicoTipo.map((h) => {
                  const isOpen = expandedAudit.has(h.id);
                  const erros = h.validacoes?.erros ?? [];
                  const avisos = h.validacoes?.avisos ?? [];
                  const bloqueada = h.status === 'rejeitado' || erros.length > 0;
                  return (
                  <React.Fragment key={h.id}>
                  <TableRow>
                    <TableCell className="p-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => toggleAudit(h.id)}
                        title={isOpen ? 'Ocultar trilha de auditoria' : 'Ver trilha de auditoria'}
                        aria-expanded={isOpen}
                      >
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{h.ano_calendario}</TableCell>
                    <TableCell>{format(new Date(h.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell>{h.total_lancamentos}</TableCell>
                    <TableCell>{h.total_linhas}</TableCell>
                    <TableCell>
                      {h.status === 'rejeitado' ? (
                        <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />{erros.length} erros</Badge>
                      ) : h.status === 'transmitido' ? (
                        <Badge className="gap-1 bg-success hover:bg-success"><CheckCircle2 className="h-3 w-3" />Transmitido</Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3" />Gerado</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {h.recibo_transmissao ? (
                        <span className="font-mono text-xs">{h.recibo_transmissao.substring(0, 12)}…</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{h.hash_sha256?.substring(0, 12)}…</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {(() => {
                          const isRejeitado = h.status === 'rejeitado';
                          const temErros = erros.length > 0;
                          const isBloqueado = bloqueada;
                          const variant = isBloqueado ? 'destructive' : avisos.length > 0 ? 'outline' : 'outline';
                          const Icon = isBloqueado ? Lock : ShieldAlert;
                          const label = isBloqueado ? 'Bloqueado' : 'Validações & Download';
                          const tooltipLabel = isRejeitado
                            ? `Transmissão rejeitada — ${erros.length} erro(s) impedem o download. Clique para revisar.`
                            : temErros
                              ? `${erros.length} erro(s) de validação bloqueiam o download. Clique para revisar.`
                              : avisos.length > 0
                                ? `${avisos.length} aviso(s) — download liberado. Clique para revisar e baixar.`
                                : 'Sem erros nem avisos. Clique para baixar .txt ou .zip.';
                          return (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant={variant as 'destructive' | 'outline'}
                                    onClick={() => setValidacoesArquivo(h)}
                                    className={cn(
                                      'gap-1.5',
                                      isBloqueado && 'border-destructive/40 text-destructive hover:bg-destructive/10',
                                      !isBloqueado && avisos.length > 0 && 'border-warning/40 text-warning hover:bg-warning/10',
                                    )}
                                  >
                                    <Icon className="h-3.5 w-3.5" />
                                    {label}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent variant={isBloqueado ? 'warning' : 'default'}>
                                  {tooltipLabel}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })()}
                        {h.status !== 'transmitido' && h.status !== 'rejeitado' && (
                          <Button size="sm" variant="outline" onClick={() => { setTransmissaoArquivo(h); setReciboInput(''); }} title="Registrar transmissão">
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow key={`${h.id}-audit`} className="bg-muted/20 hover:bg-muted/20">
                      <TableCell colSpan={9} className="p-0">
                        <div className="p-4 space-y-3 border-l-2 border-primary/30 ml-2">
                          <div className="flex items-center gap-2 text-sm font-semibold font-display tracking-tight">
                            <ScrollText className="h-4 w-4 text-primary" />
                            Trilha de auditoria · execução de {format(new Date(h.created_at), 'dd/MM/yyyy HH:mm')}
                          </div>

                          {/* Status / decisão */}
                          <div className={cn(
                            'rounded-lg border p-3 flex items-start gap-3',
                            bloqueada
                              ? 'border-destructive/30 bg-destructive/5'
                              : 'border-success/30 bg-success/5',
                          )}>
                            <div className={cn(
                              'h-8 w-8 rounded-md flex items-center justify-center shrink-0',
                              bloqueada ? 'bg-destructive/15 text-destructive' : 'bg-success/15 text-success',
                            )}>
                              {bloqueada ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 space-y-0.5">
                              <p className={cn(
                                'text-xs font-semibold',
                                bloqueada ? 'text-destructive' : 'text-success',
                              )}>
                                {bloqueada
                                  ? `Geração bloqueada — ${erros.length} erro(s) de validação`
                                  : 'Geração liberada — nenhum erro de validação'}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                Status final: <span className="font-mono">{h.status}</span>
                                {avisos.length > 0 && ` · ${avisos.length} aviso(s) tolerado(s)`}
                              </p>
                            </div>
                          </div>

                          {/* Metadados de execução */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div className="rounded-md border border-border/60 bg-card/60 p-2.5">
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Total de linhas</p>
                              <p className="text-sm font-mono font-semibold tabular-nums mt-0.5">{h.total_linhas.toLocaleString('pt-BR')}</p>
                            </div>
                            <div className="rounded-md border border-border/60 bg-card/60 p-2.5">
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Lançamentos</p>
                              <p className="text-sm font-mono font-semibold tabular-nums mt-0.5">{h.total_lancamentos.toLocaleString('pt-BR')}</p>
                            </div>
                            <div className="rounded-md border border-border/60 bg-card/60 p-2.5 col-span-2">
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium flex items-center gap-1">
                                <Hash className="h-3 w-3" /> Hash SHA-256
                              </p>
                              <button
                                type="button"
                                onClick={() => copyHash(h.hash_sha256)}
                                className="text-[11px] font-mono text-foreground/90 mt-0.5 hover:text-primary transition-colors break-all text-left w-full"
                                title="Clique para copiar"
                              >
                                {h.hash_sha256 || '—'}
                              </button>
                            </div>
                          </div>

                          {/* Erros que bloquearam */}
                          {erros.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[11px] uppercase tracking-wide text-destructive font-semibold flex items-center gap-1.5">
                                <XCircle className="h-3.5 w-3.5" /> Erros que impediram a geração ({erros.length})
                              </p>
                              <ul className="space-y-1 rounded-md border border-destructive/20 bg-destructive/5 p-2">
                                {erros.map((e, i) => (
                                  <li key={i} className="flex items-start gap-2 text-xs">
                                    <Badge variant="outline" className="border-destructive/40 text-destructive shrink-0 h-5 px-1.5 text-[10px] font-mono">
                                      {String(i + 1).padStart(2, '0')}
                                    </Badge>
                                    <span className="leading-snug">{e}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Avisos tolerados */}
                          {avisos.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[11px] uppercase tracking-wide text-warning font-semibold flex items-center gap-1.5">
                                <AlertTriangle className="h-3.5 w-3.5" /> Avisos tolerados ({avisos.length})
                              </p>
                              <ul className="space-y-1 rounded-md border border-warning/20 bg-warning/5 p-2">
                                {avisos.map((a, i) => (
                                  <li key={i} className="flex items-start gap-2 text-xs">
                                    <Badge variant="outline" className="border-warning/40 text-warning shrink-0 h-5 px-1.5 text-[10px] font-mono">
                                      {String(i + 1).padStart(2, '0')}
                                    </Badge>
                                    <span className="leading-snug">{a}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {erros.length === 0 && avisos.length === 0 && (
                            <p className="text-xs text-muted-foreground italic">
                              Nenhuma validação registrada para esta execução.
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!transmissaoArquivo} onOpenChange={(v) => !v && setTransmissaoArquivo(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar transmissão SPED {tipo}</DialogTitle>
            <DialogDescription>
              Cole o nº do recibo gerado pelo PVA-{tipo} após a transmissão oficial.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="recibo-historico">Nº do recibo</Label>
            <Input
              id="recibo-historico"
              value={reciboInput}
              onChange={e => setReciboInput(e.target.value)}
              placeholder="Ex.: 12345678901234567890"
              className="font-mono"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransmissaoArquivo(null)}>Cancelar</Button>
            <Button onClick={handleConfirmarTransmissao} disabled={!reciboInput.trim() || transmitir.isPending}>
              Marcar como transmitido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {tipo === 'ECF' && empresaId && <SpedEcfHistorico empresaId={empresaId} />}
    </div>
  );
}
