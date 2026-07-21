import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, Clock, Loader2, PlayCircle } from 'lucide-react';
import React from 'react';
import {
  useSpedContabilHistorico,
  useRegistrarTransmissaoSped,
  useGerarSpedContabil,
} from '@/hooks/useSpedContabil';
import { baixarSpedZip } from '@/lib/sped-zip';
import {
  AUDIT_EXPANDED_KEY,
  DRAFT_KEY,
  type ExportStatus,
  type HistoricoRow,
  type StatusFilter,
  type ValidacaoFilter,
} from './types';

interface Params {
  tipo: 'ECD' | 'ECF';
  empresaId?: string;
}

export function useSpedContabilState({ tipo, empresaId }: Params) {
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
      const saved = window.localStorage.getItem(AUDIT_EXPANDED_KEY(empresaId));
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [validacaoFilter, setValidacaoFilter] = useState<ValidacaoFilter>('all');
  const [searchAno, setSearchAno] = useState('');

  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  const [empresaDados, setEmpresaDados] = useState<{ cnpj: string; razao_social: string } | null>(null);
  const transmitir = useRegistrarTransmissaoSped();
  const gerarSped = useGerarSpedContabil();
  const { data: historico = [], isLoading } = useSpedContabilHistorico(empresaId);

  const historicoFiltrado = useMemo<HistoricoRow[]>(() => {
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

  const handleGerarExportar = async () => {
    if (!empresaId) return;
    setExportStatus('queued');
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
        return { icon: React.createElement(Clock, { className: 'mr-2 h-4 w-4' }), label: 'Em fila…', disabled: true, variant: 'secondary' as const, className: cn(base, 'bg-muted text-muted-foreground') };
      case 'processing':
        return { icon: React.createElement(Loader2, { className: 'mr-2 h-4 w-4 animate-spin' }), label: 'Processando…', disabled: true, variant: 'secondary' as const, className: cn(base, 'bg-primary/10 text-primary') };
      case 'done':
        return { icon: React.createElement(CheckCircle2, { className: 'mr-2 h-4 w-4' }), label: 'Concluído', disabled: false, variant: 'default' as const, className: cn(base, 'bg-success hover:bg-success text-primary-foreground') };
      case 'error':
        return { icon: React.createElement(AlertTriangle, { className: 'mr-2 h-4 w-4' }), label: 'Falhou — tentar novamente', disabled: false, variant: 'destructive' as const, className: base };
      default:
        return { icon: React.createElement(PlayCircle, { className: 'mr-2 h-4 w-4' }), label: `Gerar/Exportar SPED ${tipo}`, disabled: false, variant: 'default' as const, className: base };
    }
  })();

  const toggleAudit = (id: string) => {
    setExpandedAudit((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        AUDIT_EXPANDED_KEY(empresaId),
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

  return {
    ano, setAno,
    rascunhoRestaurado,
    wizardOpen, setWizardOpen,
    previewOpen, setPreviewOpen,
    transmissaoArquivo, setTransmissaoArquivo,
    validacoesArquivo, setValidacoesArquivo,
    reciboInput, setReciboInput,
    expandedAudit, toggleAudit,
    statusFilter, setStatusFilter,
    validacaoFilter, setValidacaoFilter,
    searchAno, setSearchAno,
    exportStatus,
    empresaDados,
    transmitir,
    historicoFiltrado,
    isLoading,
    handleGerarExportar,
    exportButton,
    copyHash,
    handleDownload,
    handleDownloadZip,
    handleConfirmarTransmissao,
  };
}
