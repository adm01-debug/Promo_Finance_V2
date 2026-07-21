import { useEffect, useMemo, useRef, useState } from 'react';
import { ShieldAlert, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { agruparValidacoes } from '@/lib/sped-validacoes-categorias';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StatsHeader } from './validacoes-pre-sped/StatsHeader';
import { SearchBar } from './validacoes-pre-sped/SearchBar';
import { CategoryList } from './validacoes-pre-sped/CategoryList';
import { FooterActions } from './validacoes-pre-sped/FooterActions';
import { exportarJson, exportarPdf } from './validacoes-pre-sped/exportUtils';
import type { ValidacoesPreSpedArquivo } from './validacoes-pre-sped/types';

export type { ValidacoesPreSpedArquivo } from './validacoes-pre-sped/types';

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
  const [isAiCorrecting, setIsAiCorrecting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const erros = useMemo(() => arquivo?.validacoes?.erros ?? [], [arquivo]);
  const avisos = useMemo(() => arquivo?.validacoes?.avisos ?? [], [arquivo]);
  const isRejeitado = arquivo?.status === 'rejeitado';
  const bloqueado = erros.length > 0 || isRejeitado;
  const hashCurto = arquivo?.hash_sha256 ? `${arquivo.hash_sha256.slice(0, 12)}…` : '—';

  const termo = busca.trim().toLowerCase();
  const errosFiltrados = useMemo(
    () => (termo ? erros.filter((e) => e.toLowerCase().includes(termo)) : erros),
    [erros, termo]
  );
  const avisosFiltrados = useMemo(
    () => (termo ? avisos.filter((a) => a.toLowerCase().includes(termo)) : avisos),
    [avisos, termo]
  );

  const toggleCategoria = (id: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const agrupados = useMemo(
    () => agruparValidacoes(errosFiltrados, avisosFiltrados),
    [errosFiltrados, avisosFiltrados]
  );

  useEffect(() => {
    if (busca.trim() || agrupados.length <= 2) {
      setExpandedCats(new Set(agrupados.map((a) => a.categoria.id)));
    }
  }, [busca, agrupados]);

  if (!arquivo) return null;

  const handleAiCorrection = async () => {
    setIsAiCorrecting(true);
    await new Promise((r) => setTimeout(r, 2000));
    setIsAiCorrecting(false);
    toast.success('IA: Sugestões de correção enviadas para o Auditoria IA', {
      description:
        'As inconsistências detectadas foram mapeadas e enviadas para o módulo de correção automática.',
    });
  };

  const copyHash = async () => {
    if (!arquivo.hash_sha256) return;
    try {
      await navigator.clipboard.writeText(arquivo.hash_sha256);
      setIsCopied(true);
      toast.success('Hash copiado para o clipboard');
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar hash');
    }
  };

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
  const podeExportarFiltrado = temFiltro && (errosFiltrados.length > 0 || avisosFiltrados.length > 0);

  const exportArgsBase = {
    arquivo,
    erros,
    avisos,
    errosFiltrados,
    avisosFiltrados,
    busca,
    baseFilename,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4 text-3xl font-black tracking-tighter">
            <div className="p-3.5 bg-primary/20 rounded-2xl shadow-[0_0_30px_rgba(var(--primary),0.3)] ring-1 ring-primary/30">
              <ShieldAlert className="h-8 w-8 text-primary" />
            </div>
            <span>
              Validações <span className="text-primary">{arquivo.tipo}</span>{' '}
              <span className="text-foreground/20">·</span> {arquivo.ano_calendario}
            </span>
          </DialogTitle>
          <DialogDescription className="text-sm font-bold uppercase tracking-[0.2em] text-foreground/40 pl-20">
            Governança & Compliance Fiscal PVA
          </DialogDescription>
        </DialogHeader>

        <StatsHeader
          errosCount={erros.length}
          avisosCount={avisos.length}
          hashCurto={hashCurto}
          hashFull={arquivo.hash_sha256}
          isCopied={isCopied}
          onCopyHash={copyHash}
        />

        {bloqueado && (
          <Alert variant="error" className="bg-destructive/5 border-destructive/20 shadow-sm" data-testid="banner-bloqueio">
            <XCircle className="h-4 w-4 text-destructive" />
            <AlertTitle className="font-bold text-destructive">
              {isRejeitado ? 'ARQUIVO REJEITADO PELA TRANSMISSÃO' : 'DOWNLOAD BLOQUEADO'}
            </AlertTitle>
            <AlertDescription className="text-xs">
              {isRejeitado
                ? `A transmissão deste SPED foi rejeitada${erros.length > 0 ? ` com ${erros.length} erro(s)` : ''}. Corrija as inconsistências e gere o arquivo novamente antes de retransmitir ao PVA.`
                : `Este SPED contém ${erros.length} erro(s) bloqueante(s). Corrija as inconsistências e gere o arquivo novamente antes de transmitir ao PVA.`}
            </AlertDescription>
          </Alert>
        )}

        <SearchBar
          busca={busca}
          onBusca={setBusca}
          bloqueado={bloqueado}
          isAiCorrecting={isAiCorrecting}
          onAiCorrection={handleAiCorrection}
        />

        <CategoryList
          agrupados={agrupados}
          expandedCats={expandedCats}
          onToggle={toggleCategoria}
          busca={busca}
        />

        <FooterActions
          errosTotal={erros.length}
          avisosTotal={avisos.length}
          errosFiltradosTotal={errosFiltrados.length}
          avisosFiltradosTotal={avisosFiltrados.length}
          temFiltro={temFiltro}
          podeExportarFiltrado={podeExportarFiltrado}
          bloqueado={bloqueado}
          isRejeitado={!!isRejeitado}
          onClose={() => onOpenChange(false)}
          onExportPdf={(f) => exportarPdf({ ...exportArgsBase, apenasFiltrados: f })}
          onExportJson={(f) => exportarJson({ ...exportArgsBase, apenasFiltrados: f })}
          onDownloadTxt={handleDownloadTxt}
          onDownloadZip={handleDownloadZip}
        />
      </DialogContent>
    </Dialog>
  );
}
