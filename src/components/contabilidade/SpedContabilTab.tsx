import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, FileText, AlertTriangle, CheckCircle2, ShieldAlert, 
  FileArchive, Wand2, Send, FileSearch, ChevronDown, ChevronRight, 
  ScrollText, XCircle, Hash, Lock, Unlock, Loader2, Clock, 
  PlayCircle, Filter, X, Search, Link2, Zap, ShieldCheck,
  History, ExternalLink, Activity, Layers, Cpu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSpedContabilHistorico, useRegistrarTransmissaoSped, useGerarSpedContabil } from '@/hooks/useSpedContabil';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SpedEcdWizard } from './SpedEcdWizard';
import { agruparValidacoes } from '@/lib/sped-validacoes-categorias';
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
  periodo_inicio: string;
  periodo_fim: string;
  gerado_por: string | null;
  empresa_id: string;
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
  const [expandedAudit, setExpandedAudit] = useState<Set<string>>(() => {
    try {
      const saved = window.localStorage.getItem(`sped-audit:expanded:${empresaId || '_'}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [statusFilter, setStatusFilter] = useState<'all' | 'liberada' | 'bloqueada' | 'transmitida'>('all');
  const [validacaoFilter, setValidacaoFilter] = useState<'all' | 'com_erros' | 'com_avisos' | 'sem_alertas'>('all');
  const [searchAno, setSearchAno] = useState('');

  const [exportStatus, setExportStatus] = useState<'idle' | 'queued' | 'processing' | 'done' | 'error'>('idle');
  const [empresaDados, setEmpresaDados] = useState<{ cnpj: string; razao_social: string } | null>(null);
  const transmitir = useRegistrarTransmissaoSped();
  const gerarSped = useGerarSpedContabil();
  const { data: historico = [], isLoading } = useSpedContabilHistorico(empresaId);
  
  const historicoFiltrado = useMemo(() => {
    return (historico as unknown as HistoricoRow[])
      .filter((h) => h.tipo === tipo)
      .filter((h) => {
        if (searchAno && !String(h.ano_calendario).includes(searchAno)) return false;

        const erros = h.validacoes?.erros ?? [];
        const avisos = h.validacoes?.avisos ?? [];
        const bloqueada = h.status === 'rejeitado' || erros.length > 0;
        const transmitida = h.status === 'transmitido';
        const liberada = !bloqueada && !transmitida;

        if (statusFilter === 'bloqueada' && !bloqueada) return false;
        if (statusFilter === 'transmitida' && !transmitida) return false;
        if (statusFilter === 'liberada' && !liberada) return false;

        if (validacaoFilter === 'com_erros' && erros.length === 0) return false;
        if (validacaoFilter === 'com_avisos' && avisos.length === 0) return false;
        if (validacaoFilter === 'sem_alertas' && (erros.length > 0 || avisos.length > 0)) return false;

        return true;
      });
  }, [historico, tipo, searchAno, statusFilter, validacaoFilter]);

  const anosDisponiveis = useMemo(
    () => Array.from(new Set((historico as unknown as HistoricoRow[]).filter(h => h.tipo === tipo).map((h) => h.ano_calendario))).sort((a, b) => b - a),
    [historico, tipo],
  );

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

  // Persistir o estado de expandir/recolher a trilha de auditoria
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        `sped-audit:expanded:${empresaId || '_'}`,
        JSON.stringify(Array.from(expandedAudit))
      );
    } catch { /* noop */ }
  }, [expandedAudit, empresaId]);

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


  useEffect(() => {
    if (!empresaId) return;
    supabase
      .from('empresas')
      .select('cnpj, razao_social')
      .eq('id', empresaId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setEmpresaDados(data);
      });
  }, [empresaId]);

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
    <div className="space-y-10">
      {/* Cards de KPI de Governança */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/5 p-6 rounded-[2.5rem] relative overflow-hidden group/kpi"
        >
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover/kpi:scale-110 transition-transform">
            <History className="h-20 w-20 text-primary" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Total Gerado</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-4xl font-black tracking-tighter tabular-nums">{historicoFiltrado.length}</p>
            <span className="text-[10px] font-bold text-primary/60">Arquivos em {ano}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 border border-white/5 p-6 rounded-[2.5rem] relative overflow-hidden group/kpi"
        >
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover/kpi:scale-110 transition-transform">
            <ShieldCheck className="h-20 w-20 text-success" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Taxa de Sucesso</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-4xl font-black tracking-tighter tabular-nums text-success">
              {historicoFiltrado.length > 0 
                ? Math.round((historicoFiltrado.filter(h => h.status === 'transmitido' || h.status === 'gerado').length / historicoFiltrado.length) * 100)
                : 100}%
            </p>
            <CheckCircle2 className="h-4 w-4 text-success opacity-40" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 border border-white/5 p-6 rounded-[2.5rem] relative overflow-hidden group/kpi"
        >
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover/kpi:scale-110 transition-transform">
            <Layers className="h-20 w-20 text-purple-400" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Volume Analítico</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-3xl font-black tracking-tighter tabular-nums">
              {historicoFiltrado.reduce((acc, h) => acc + h.total_lancamentos, 0).toLocaleString('pt-BR')}
            </p>
            <span className="text-[10px] font-bold opacity-40">Lanç.</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/5 p-6 rounded-[2.5rem] relative overflow-hidden group/kpi"
        >
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover/kpi:scale-110 transition-transform">
            <Cpu className="h-20 w-20 text-orange-400" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Processamento</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-3xl font-black tracking-tighter tabular-nums">High-Speed</p>
            <Zap className="h-4 w-4 text-orange-400 opacity-40" />
          </div>
        </motion.div>
      </div>

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
          cnpj: empresaDados?.cnpj,
          razao_social: empresaDados?.razao_social,
          periodo_inicio: validacoesArquivo.periodo_inicio,
          periodo_fim: validacoesArquivo.periodo_fim,
          gerado_por: validacoesArquivo.gerado_por,
          created_at: validacoesArquivo.created_at,
          total_lancamentos: validacoesArquivo.total_lancamentos,
          total_linhas: validacoesArquivo.total_linhas,
        } satisfies ValidacoesPreSpedArquivo : null}
        onDownloadTxt={() => validacoesArquivo && handleDownload(validacoesArquivo.storage_path)}
        onDownloadZip={() => validacoesArquivo && handleDownloadZip(validacoesArquivo)}
      />

      <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden ring-1 ring-white/10 relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <CardHeader className="p-10 pb-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="p-4 rounded-2xl bg-primary shadow-xl shadow-primary/20 text-primary-foreground transform group-hover:scale-110 transition-transform duration-500">
              <FileArchive className="h-8 w-8" />
            </div>
            <div>
              <CardTitle className="text-4xl font-black tracking-tight">
                Núcleo de Transmissão {tipo}
              </CardTitle>
              <CardDescription className="text-lg font-medium opacity-70">
                {tipo === 'ECD'
                  ? 'Escrituração Contábil Digital • Interface Federada'
                  : 'Escrituração Contábil Fiscal • Módulo Inteligente'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-10 pt-2 relative z-10 space-y-8">
          <div className="grid gap-8 md:grid-cols-12 items-end">
            <div className="md:col-span-3 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Ano-Calendário</Label>
                {rascunhoRestaurado && (
                  <Badge variant="secondary" className="text-[10px] font-black uppercase bg-primary/10 text-primary border-none animate-pulse">
                    Restaurado
                  </Badge>
                )}
              </div>
              <Input 
                type="number" 
                min={2010} 
                max={new Date().getFullYear()} 
                value={ano}
                onChange={e => setAno(Number(e.target.value))} 
                className="h-14 bg-white/5 border-white/10 rounded-2xl font-black text-xl tracking-tighter focus:ring-primary/40 focus:border-primary transition-all text-center"
              />
            </div>

            <div className="md:col-span-9 flex items-center gap-4">
              {tipo === 'ECD' && (
                <Button
                  disabled={!empresaId}
                  variant="outline"
                  onClick={() => setPreviewOpen(true)}
                  className="flex-1 h-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 font-bold gap-3 transition-all hover:translate-y-[-2px] active:translate-y-[0px]"
                >
                  <FileSearch className="h-5 w-5 text-primary" />
                  Pré-visualizar
                </Button>
              )}
              
              <Button 
                disabled={!empresaId} 
                variant="outline" 
                onClick={() => setWizardOpen(true)} 
                className="flex-1 h-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 font-bold gap-3 transition-all hover:translate-y-[-2px] active:translate-y-[0px]"
              >
                <Wand2 className="h-5 w-5 text-purple-400" />
                Inteligência Assistida
              </Button>

              <Button
                disabled={!empresaId || exportButton.disabled}
                onClick={handleGerarExportar}
                variant={exportButton.variant}
                className={cn(
                  exportButton.className,
                  "flex-1 h-14 rounded-2xl font-black gap-3 shadow-xl transition-all hover:translate-y-[-2px] active:translate-y-[0px]"
                )}
              >
                {exportButton.icon}
                {exportButton.label}
              </Button>
            </div>
          </div>

          {exportStatus !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                'flex items-center gap-4 rounded-[1.5rem] border p-6 backdrop-blur-md shadow-lg',
                exportStatus === 'queued' && 'border-white/10 bg-white/5 text-muted-foreground',
                exportStatus === 'processing' && 'border-primary/20 bg-primary/5 text-primary',
                exportStatus === 'done' && 'border-success/20 bg-success/5 text-success',
                exportStatus === 'error' && 'border-destructive/20 bg-destructive/5 text-destructive',
              )}
            >
              <div className="p-3 rounded-xl bg-current/10">
                {exportStatus === 'queued' && <Clock className="h-6 w-6" />}
                {exportStatus === 'processing' && <Loader2 className="h-6 w-6 animate-spin" />}
                {exportStatus === 'done' && <CheckCircle2 className="h-6 w-6" />}
                {exportStatus === 'error' && <AlertTriangle className="h-6 w-6" />}
              </div>
              <div className="flex-1">
                <p className="font-bold tracking-tight text-base">
                  {exportStatus === 'queued' && `Preparando Geração SPED ${tipo}`}
                  {exportStatus === 'processing' && `Processando Lote de Dados (${ano})`}
                  {exportStatus === 'done' && `SPED ${tipo} Gerado com Sucesso`}
                  {exportStatus === 'error' && `Falha na Geração do Arquivo`}
                </p>
                <p className="text-sm opacity-70">
                  {exportStatus === 'queued' && 'Aguardando disponibilidade dos recursos computacionais.'}
                  {exportStatus === 'processing' && 'Apurando saldos e formatando blocos regulatórios...'}
                  {exportStatus === 'done' && 'O arquivo foi validado internamente e está pronto para download.'}
                  {exportStatus === 'error' && 'Ocorreu um erro inesperado. Verifique os logs de auditoria.'}
                </p>
              </div>
            </motion.div>
          )}

          <div className="p-6 rounded-[1.5rem] bg-warning/5 border border-warning/20 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-warning/20 text-warning">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-warning mb-1 uppercase tracking-tight">Importante: Validação Obrigatória</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Este arquivo é gerado em conformidade com o Layout 9/10, porém deve ser <strong>obrigatoriamente validado no PVA oficial</strong> da Receita Federal antes de qualquer transmissão definitiva.
                {tipo === 'ECF' && ' Lembre-se que a ECF exige a recuperação prévia da ECD do mesmo período.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden ring-1 ring-white/10 relative mt-10">
        <CardHeader className="p-10 pb-6 relative z-10">
          <div>
            <CardTitle className="text-3xl font-black tracking-tight">Histórico de Gerações</CardTitle>
            <CardDescription className="text-sm font-medium opacity-60">Repositório de auditoria e compliance regulatório</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 mb-2">
            <div className="space-y-1.5 flex-1 min-w-[140px]">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Buscar Ano</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchAno}
                  onChange={(e) => setSearchAno(e.target.value)}
                  placeholder="Ex.: 2024"
                  className="h-10 pl-9 bg-black/20 border-white/5 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5 flex-1 min-w-[160px]">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Status</Label>
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="h-10 bg-black/20 border-white/5 rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="liberada">Liberada</SelectItem>
                  <SelectItem value="bloqueada">Bloqueada</SelectItem>
                  <SelectItem value="transmitida">Transmitida</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 flex-1 min-w-[180px]">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-1">Validações</Label>
              <Select value={validacaoFilter} onValueChange={(v: any) => setValidacaoFilter(v)}>
                <SelectTrigger className="h-10 bg-black/20 border-white/5 rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="com_erros">Com erros</SelectItem>
                  <SelectItem value="com_avisos">Com avisos</SelectItem>
                  <SelectItem value="sem_alertas">Sem alertas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(searchAno || statusFilter !== 'all' || validacaoFilter !== 'all') && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setSearchAno(''); setStatusFilter('all'); setValidacaoFilter('all'); }}
                className="h-10 rounded-xl px-4 gap-2 text-xs font-bold hover:bg-white/10"
              >
                <X className="h-3.5 w-3.5" />
                Limpar
              </Button>
            )}
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : historicoFiltrado.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="inline-flex p-4 rounded-full bg-white/5 text-muted-foreground/30">
                <Filter className="h-8 w-8" />
              </div>
              <p className="text-muted-foreground font-medium">Nenhum registro encontrado para os filtros aplicados.</p>
              <Button variant="link" onClick={() => { setSearchAno(''); setStatusFilter('all'); setValidacaoFilter('all'); }}>
                Limpar todos os filtros
              </Button>
            </div>
          ) : (
            <div className="rounded-[2rem] border border-white/5 overflow-hidden bg-black/20 shadow-inner">
              <div className="overflow-x-auto custom-scrollbar">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="w-12 p-6"></TableHead>
                      <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] opacity-40 text-left">Período Fiscal</TableHead>
                      <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] opacity-40 text-left">Geração / Lote</TableHead>
                      <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] opacity-40 text-left">Métricas</TableHead>
                      <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] opacity-40 text-left">Status Auditoria</TableHead>
                      <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] opacity-40 text-left">Protocolo / Hash</TableHead>
                      <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] opacity-40 text-right pr-8">Governança</TableHead>
                    </TableRow>
                  </TableHeader>
              <TableBody>
                {historicoFiltrado.map((h) => {
                  const isOpen = expandedAudit.has(h.id);
                  const erros = h.validacoes?.erros ?? [];
                  const avisos = h.validacoes?.avisos ?? [];
                  const bloqueada = h.status === 'rejeitado' || erros.length > 0;
                  const ecdDivergente = [...erros, ...avisos].some(m => /\b(ECD|cross[-\s]?check|K355|L100|hash)\b/i.test(m));
                  
                  return (
                  <React.Fragment key={h.id}>
                  {bloqueada && (
                    <TableRow className="bg-destructive/5 hover:bg-destructive/5 border-none">
                      <TableCell colSpan={9} className="py-2 px-6">
                        <div className="flex items-center gap-2 text-destructive text-xs font-bold">
                          <XCircle className="h-3 w-3" />
                          Execução bloqueada por erros de validação. Corrija para liberar o download.
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {ecdDivergente && (
                    <TableRow className="bg-warning/5 hover:bg-warning/5 border-none">
                      <TableCell colSpan={9} className="py-2 px-6">
                        <div className="flex items-center gap-2 text-warning text-xs font-bold">
                          <Link2 className="h-3 w-3" />
                          Divergências detectadas em relação à ECD do mesmo período. Verifique os saldos.
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow className={cn(
                    (bloqueada || ecdDivergente) && "border-t-0"
                  )}>
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
                    <TableCell className="p-6">
                      <Badge variant="outline" className="font-mono text-[11px] font-black border-none bg-primary/10 text-primary px-2.5 py-0.5 rounded-lg">
                        {h.ano_calendario}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground/80">{format(new Date(h.created_at), 'dd/MM/yyyy HH:mm')}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-30 mt-1">Lote: #{h.id.substring(0, 8)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-foreground/60">{h.total_lancamentos.toLocaleString('pt-BR')} Lanç.</span>
                          <span className="text-[9px] font-bold opacity-30 uppercase">{h.total_linhas.toLocaleString('pt-BR')} Linhas</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-6">
                      {h.status === 'rejeitado' ? (
                        <Badge variant="destructive" className="gap-1.5 font-black text-[9px] uppercase tracking-widest border-none px-3 py-1 rounded-full"><AlertTriangle className="h-3 w-3" />{erros.length} erros</Badge>
                      ) : h.status === 'transmitido' ? (
                        <Badge className="gap-1.5 bg-success/20 text-success font-black text-[9px] uppercase tracking-widest border-none px-3 py-1 rounded-full"><ShieldCheck className="h-3 w-3" />Transmitido</Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1.5 font-black text-[9px] uppercase tracking-widest border-none px-3 py-1 rounded-full"><CheckCircle2 className="h-3 w-3" />Gerado</Badge>
                      )}
                    </TableCell>
                    <TableCell className="p-6">
                      <div className="flex flex-col gap-1">
                        {h.recibo_transmissao ? (
                          <div className="flex items-center gap-1.5">
                            <Hash className="h-3 w-3 opacity-30" />
                            <span className="font-mono text-[10px] font-black text-primary">{h.recibo_transmissao.substring(0, 16)}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold opacity-20 uppercase tracking-widest">Aguardando Protocolo</span>
                        )}
                        <span className="font-mono text-[9px] opacity-30">{h.hash_sha256?.substring(0, 16)}…</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
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

                          {/* Agrupamento por Categoria */}
                          {(() => {
                            const grupos = agruparValidacoes(erros, avisos);
                            if (grupos.length === 0) return null;

                            return (
                              <div className="grid gap-4 md:grid-cols-2">
                                {grupos.map(({ categoria, erros: gErros, avisos: gAvisos }) => {
                                  const tone = gErros.length > 0 ? 'destructive' : 'warning';
                                  return (
                                    <div 
                                      key={categoria.id} 
                                      className={cn(
                                        "rounded-xl border p-4 space-y-3",
                                        tone === 'destructive' ? "bg-destructive/5 border-destructive/10" : "bg-warning/5 border-warning/10"
                                      )}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <div className={cn(
                                            "p-1.5 rounded-lg",
                                            tone === 'destructive' ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                                          )}>
                                            <AlertTriangle className="h-3.5 w-3.5" />
                                          </div>
                                          <div>
                                            <h4 className={cn("text-xs font-black uppercase tracking-wider", tone === 'destructive' ? "text-destructive" : "text-warning")}>
                                              {categoria.label}
                                            </h4>
                                            <p className="text-[10px] text-muted-foreground opacity-70">{categoria.description}</p>
                                          </div>
                                        </div>
                                        <div className="flex gap-1">
                                          {gErros.length > 0 && <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">{gErros.length}</Badge>}
                                          {gAvisos.length > 0 && <Badge variant="outline" className="h-5 px-1.5 text-[10px] border-warning/30 text-warning bg-warning/5">{gAvisos.length}</Badge>}
                                        </div>
                                      </div>
                                      
                                      <ul className="space-y-1.5">
                                        {[...gErros.map(e => ({ text: e, type: 'error' as const })), ...gAvisos.map(a => ({ text: a, type: 'warn' as const }))].map((item, idx) => (
                                          <li key={idx} className={cn(
                                            "text-[11px] leading-relaxed p-2 rounded-lg border",
                                            item.type === 'error' ? "bg-destructive/10 border-destructive/10 text-destructive" : "bg-warning/10 border-warning/10 text-warning-foreground"
                                          )}>
                                            {item.text}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}

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
              </div>
            </div>
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
