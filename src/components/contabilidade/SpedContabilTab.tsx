import { motion } from 'framer-motion';
import {
  AlertTriangle, CheckCircle2, Clock, FileArchive, FileSearch, Loader2,
  ShieldAlert, Wand2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SpedEcdWizard } from './SpedEcdWizard';
import { SpedEcfWizard } from './SpedEcfWizard';
import { SpedEcfHistorico } from './SpedEcfHistorico';
import { SpedEcdPreviewDialog } from './SpedEcdPreviewDialog';
import { ValidacoesPreSpedDialog, type ValidacoesPreSpedArquivo } from './ValidacoesPreSpedDialog';
import { SpedKpiCards } from './sped-contabil/SpedKpiCards';
import { SpedFilterBar } from './sped-contabil/SpedFilterBar';
import { SpedHistoricoTable } from './sped-contabil/SpedHistoricoTable';
import { SpedTransmissaoDialog } from './sped-contabil/SpedTransmissaoDialog';
import { useSpedContabilState } from './sped-contabil/useSpedContabilState';

interface Props {
  tipo: 'ECD' | 'ECF';
  empresaId?: string;
}

export function SpedContabilTab({ tipo, empresaId }: Props) {
  const s = useSpedContabilState({ tipo, empresaId });

  const clearFilters = () => {
    s.setSearchAno('');
    s.setStatusFilter('all');
    s.setValidacaoFilter('all');
  };

  return (
    <div className="space-y-10">
      <SpedKpiCards historicoFiltrado={s.historicoFiltrado} ano={s.ano} />

      {tipo === 'ECD' && empresaId && (
        <>
          <SpedEcdWizard open={s.wizardOpen} onOpenChange={s.setWizardOpen} empresaId={empresaId} anoCalendario={s.ano} />
          <SpedEcdPreviewDialog
            open={s.previewOpen}
            onOpenChange={s.setPreviewOpen}
            empresaId={empresaId}
            anoCalendario={s.ano}
            onAbrirWizard={() => s.setWizardOpen(true)}
          />
        </>
      )}
      {tipo === 'ECF' && empresaId && (
        <SpedEcfWizard open={s.wizardOpen} onOpenChange={s.setWizardOpen} empresaId={empresaId} anoCalendario={s.ano} />
      )}

      <ValidacoesPreSpedDialog
        open={!!s.validacoesArquivo}
        onOpenChange={(v) => { if (!v) s.setValidacoesArquivo(null); }}
        arquivo={s.validacoesArquivo ? {
          tipo: s.validacoesArquivo.tipo as 'ECD' | 'ECF',
          ano_calendario: s.validacoesArquivo.ano_calendario,
          hash_sha256: s.validacoesArquivo.hash_sha256,
          status: s.validacoesArquivo.status,
          validacoes: s.validacoesArquivo.validacoes ?? { erros: [], avisos: [] },
          cnpj: s.empresaDados?.cnpj,
          razao_social: s.empresaDados?.razao_social,
          periodo_inicio: s.validacoesArquivo.periodo_inicio,
          periodo_fim: s.validacoesArquivo.periodo_fim,
          gerado_por: s.validacoesArquivo.gerado_por,
          created_at: s.validacoesArquivo.created_at,
          total_lancamentos: s.validacoesArquivo.total_lancamentos,
          total_linhas: s.validacoesArquivo.total_linhas,
        } satisfies ValidacoesPreSpedArquivo : null}
        onDownloadTxt={() => s.validacoesArquivo && s.handleDownload(s.validacoesArquivo.storage_path)}
        onDownloadZip={() => s.validacoesArquivo && s.handleDownloadZip(s.validacoesArquivo)}
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
                {s.rascunhoRestaurado && (
                  <Badge variant="secondary" className="text-[10px] font-black uppercase bg-primary/10 text-primary border-none animate-pulse">
                    Restaurado
                  </Badge>
                )}
              </div>
              <Input
                type="number"
                min={2010}
                max={new Date().getFullYear()}
                value={s.ano}
                onChange={e => s.setAno(Number(e.target.value))}
                className="h-14 bg-card/5 border-white/10 rounded-2xl font-black text-xl tracking-tighter focus:ring-primary/40 focus:border-primary transition-all text-center"
              />
            </div>

            <div className="md:col-span-9 flex items-center gap-4">
              {tipo === 'ECD' && (
                <Button
                  disabled={!empresaId}
                  variant="outline"
                  onClick={() => s.setPreviewOpen(true)}
                  className="flex-1 h-14 rounded-2xl border-white/10 bg-card/5 hover:bg-card/10 font-bold gap-3 transition-all hover:translate-y-[-2px] active:translate-y-[0px]"
                >
                  <FileSearch className="h-5 w-5 text-primary" />
                  Pré-visualizar
                </Button>
              )}

              <Button
                disabled={!empresaId}
                variant="outline"
                onClick={() => s.setWizardOpen(true)}
                className="flex-1 h-14 rounded-2xl border-white/10 bg-card/5 hover:bg-card/10 font-bold gap-3 transition-all hover:translate-y-[-2px] active:translate-y-[0px]"
              >
                <Wand2 className="h-5 w-5 text-purple-400" />
                Inteligência Assistida
              </Button>

              <Button
                disabled={!empresaId || s.exportButton.disabled}
                onClick={s.handleGerarExportar}
                variant={s.exportButton.variant}
                className={cn(
                  s.exportButton.className,
                  'flex-1 h-14 rounded-2xl font-black gap-3 shadow-xl transition-all hover:translate-y-[-2px] active:translate-y-[0px]'
                )}
              >
                {s.exportButton.icon}
                {s.exportButton.label}
              </Button>
            </div>
          </div>

          {s.exportStatus !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                'flex items-center gap-4 rounded-[1.5rem] border p-6 backdrop-blur-md shadow-lg',
                s.exportStatus === 'queued' && 'border-white/10 bg-card/5 text-muted-foreground',
                s.exportStatus === 'processing' && 'border-primary/20 bg-primary/5 text-primary',
                s.exportStatus === 'done' && 'border-success/20 bg-success/5 text-success',
                s.exportStatus === 'error' && 'border-destructive/20 bg-destructive/5 text-destructive',
              )}
            >
              <div className="p-3 rounded-xl bg-current/10">
                {s.exportStatus === 'queued' && <Clock className="h-6 w-6" />}
                {s.exportStatus === 'processing' && <Loader2 className="h-6 w-6 animate-spin" />}
                {s.exportStatus === 'done' && <CheckCircle2 className="h-6 w-6" />}
                {s.exportStatus === 'error' && <AlertTriangle className="h-6 w-6" />}
              </div>
              <div className="flex-1">
                <p className="font-bold tracking-tight text-base">
                  {s.exportStatus === 'queued' && `Preparando Geração SPED ${tipo}`}
                  {s.exportStatus === 'processing' && `Processando Lote de Dados (${s.ano})`}
                  {s.exportStatus === 'done' && `SPED ${tipo} Gerado com Sucesso`}
                  {s.exportStatus === 'error' && `Falha na Geração do Arquivo`}
                </p>
                <p className="text-sm opacity-70">
                  {s.exportStatus === 'queued' && 'Aguardando disponibilidade dos recursos computacionais.'}
                  {s.exportStatus === 'processing' && 'Apurando saldos e formatando blocos regulatórios...'}
                  {s.exportStatus === 'done' && 'O arquivo foi validado internamente e está pronto para download.'}
                  {s.exportStatus === 'error' && 'Ocorreu um erro inesperado. Verifique os logs de auditoria.'}
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
          <SpedFilterBar
            searchAno={s.searchAno}
            onSearchAnoChange={s.setSearchAno}
            statusFilter={s.statusFilter}
            onStatusFilterChange={s.setStatusFilter}
            validacaoFilter={s.validacaoFilter}
            onValidacaoFilterChange={s.setValidacaoFilter}
            onClear={clearFilters}
          />

          <SpedHistoricoTable
            isLoading={s.isLoading}
            historicoFiltrado={s.historicoFiltrado}
            expandedAudit={s.expandedAudit}
            onToggleAudit={s.toggleAudit}
            onCopyHash={s.copyHash}
            onOpenValidacoes={s.setValidacoesArquivo}
            onOpenTransmissao={(h) => { s.setTransmissaoArquivo(h); s.setReciboInput(''); }}
            onClearFilters={clearFilters}
          />
        </CardContent>
      </Card>

      <SpedTransmissaoDialog
        open={!!s.transmissaoArquivo}
        onOpenChange={(v) => !v && s.setTransmissaoArquivo(null)}
        tipo={tipo}
        reciboInput={s.reciboInput}
        onReciboInputChange={s.setReciboInput}
        onConfirm={s.handleConfirmarTransmissao}
        onCancel={() => s.setTransmissaoArquivo(null)}
        pending={s.transmitir.isPending}
      />

      {tipo === 'ECF' && empresaId && <SpedEcfHistorico empresaId={empresaId} />}
    </div>
  );
}
