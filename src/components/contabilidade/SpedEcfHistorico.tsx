import { useMemo, useState, useEffect } from 'react';
import { FileText, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSpedEcfHistorico, type SpedEcfHistoricoRow } from '@/hooks/useSpedEcfHistorico';
import { supabase } from '@/integrations/supabase/client';
import { baixarSpedZip } from '@/lib/sped-zip';
import { toast } from 'sonner';
import { AlertasResumo, type ResumoAlertas } from './sped-ecf-historico/AlertasResumo';
import { HistoricoFilters, type StatusFilter, type ValidacaoFilter } from './sped-ecf-historico/HistoricoFilters';
import { HistoricoRow } from './sped-ecf-historico/HistoricoRow';
import { ValidacoesDialog } from './sped-ecf-historico/ValidacoesDialog';

interface Props {
  empresaId?: string;
}

// Heurística: mensagens de aviso/erro relacionadas ao cross-check ECF × ECD.
const ECD_PATTERN = /\b(ECD|cross[-\s]?check|K355|L100|hash)\b/i;

export function SpedEcfHistorico({ empresaId }: Props) {
  const { data: historico = [], isLoading } = useSpedEcfHistorico(empresaId);
  const [errosAbertos, setErrosAbertos] = useState<SpedEcfHistoricoRow | null>(null);
  const [searchAno, setSearchAno] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [validacaoFilter, setValidacaoFilter] = useState<ValidacaoFilter>('all');
  const [expandedAudit, setExpandedAudit] = useState<Set<string>>(() => {
    try {
      const saved = window.localStorage.getItem(`sped-ecf-audit:expanded:${empresaId || '_'}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        `sped-ecf-audit:expanded:${empresaId || '_'}`,
        JSON.stringify(Array.from(expandedAudit)),
      );
    } catch { /* noop */ }
  }, [expandedAudit, empresaId]);

  const toggleAudit = (id: string) => {
    setExpandedAudit((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const anosDisponiveis = useMemo(
    () => Array.from(new Set(historico.map((h) => h.ano_calendario))).sort((a, b) => b - a),
    [historico],
  );

  const resumoAlertas = useMemo<ResumoAlertas>(() => {
    const bloqueadas: { row: SpedEcfHistoricoRow; erros: number }[] = [];
    const divergencias: { row: SpedEcfHistoricoRow; total: number }[] = [];
    const anosBloq = new Set<number>();
    const anosDiv = new Set<number>();
    for (const h of historico) {
      const erros = h.validacoes?.erros ?? [];
      const avisos = h.validacoes?.avisos ?? [];
      if (h.status === 'rejeitado' || erros.length > 0) {
        bloqueadas.push({ row: h, erros: erros.length });
        anosBloq.add(h.ano_calendario);
      }
      const divs = [...erros, ...avisos].filter((m) => ECD_PATTERN.test(m));
      if (divs.length > 0) {
        divergencias.push({ row: h, total: divs.length });
        anosDiv.add(h.ano_calendario);
      }
    }
    return { bloqueadas, divergencias, anosBloq, anosDiv };
  }, [historico]);

  const filtrados = useMemo(() => {
    const q = searchAno.trim();
    return historico.filter((h) => {
      if (q && !String(h.ano_calendario).includes(q)) return false;
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
  }, [historico, searchAno, statusFilter, validacaoFilter]);

  const filtrosAtivos =
    (searchAno.trim() ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (validacaoFilter !== 'all' ? 1 : 0);

  const limparFiltros = () => {
    setSearchAno('');
    setStatusFilter('all');
    setValidacaoFilter('all');
  };

  const handleDownloadTxt = async (h: SpedEcfHistoricoRow) => {
    const { data, error } = await supabase.storage
      .from('relatorios-tributarios')
      .createSignedUrl(h.storage_path, 60 * 60);
    if (error || !data) { toast.error('Falha ao gerar link'); return; }
    window.open(data.signedUrl, '_blank');
  };

  const handleDownloadZip = async (h: SpedEcfHistoricoRow) => {
    const { data, error } = await supabase.storage
      .from('relatorios-tributarios')
      .createSignedUrl(h.storage_path, 60 * 60);
    if (error || !data) { toast.error('Falha ao gerar link'); return; }
    const fileName = h.storage_path.split('/').pop() || `ECF-${h.ano_calendario}.txt`;
    try {
      await baixarSpedZip({
        txtUrl: data.signedUrl, fileName, hash: h.hash_sha256 || 'N/A',
        empresa: { razao_social: h.razao_social, cnpj: h.cnpj },
        periodo: { inicio: `${h.ano_calendario}-01-01`, fim: `${h.ano_calendario}-12-31` },
        totalLinhas: h.total_linhas ?? 0, totalLancamentos: h.total_lancamentos ?? 0,
        tipo: 'ECF',
      });
      toast.success('ZIP baixado');
    } catch (e) {
      toast.error(`Falha: ${e instanceof Error ? e.message : 'erro'}`);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Histórico de gerações — SPED ECF
          </CardTitle>
          <CardDescription>Data/hora, CNPJ e status de cada arquivo ECF gerado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AlertasResumo
            resumo={resumoAlertas}
            onOpenErros={setErrosAbertos}
            onFilterBloqueadas={() => setStatusFilter('bloqueada')}
          />

          {historico.length > 0 && (
            <HistoricoFilters
              anosDisponiveis={anosDisponiveis}
              searchAno={searchAno}
              setSearchAno={setSearchAno}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              validacaoFilter={validacaoFilter}
              setValidacaoFilter={setValidacaoFilter}
              filtrosAtivos={filtrosAtivos}
              totalFiltrados={filtrados.length}
              totalHistorico={historico.length}
              onLimpar={limparFiltros}
            />
          )}

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : historico.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum arquivo ECF gerado ainda.</p>
          ) : filtrados.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Filter className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">Nenhum arquivo encontrado com os filtros aplicados.</p>
              <Button size="sm" variant="link" onClick={limparFiltros}>Limpar filtros</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Data/hora</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((h) => (
                  <HistoricoRow
                    key={h.id}
                    row={h}
                    isOpen={expandedAudit.has(h.id)}
                    onToggle={() => toggleAudit(h.id)}
                    onOpenErros={setErrosAbertos}
                    onDownloadTxt={handleDownloadTxt}
                    onDownloadZip={handleDownloadZip}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ValidacoesDialog row={errosAbertos} onClose={() => setErrosAbertos(null)} />
    </>
  );
}
