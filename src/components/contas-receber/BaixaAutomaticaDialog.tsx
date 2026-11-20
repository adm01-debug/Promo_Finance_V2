import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle2, Loader2, AlertTriangle, Info, Landmark } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useContasBancarias } from '@/hooks/useFinancialData';
import { cn } from '@/lib/utils';
import { parseExtratoBancario, ExtratoOFX, ResultadoImportacao } from '@/lib/ofx-parser';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { registrarEventoFinanceiroOrThrow } from '@/lib/financeiro/registrarEvento';
import type { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { formatCurrency, toISOLocal } from '@/lib/formatters';
import type {
  BaixaAutomaticaDialogProps,
  Step,
  MatchResult,
  TransacaoBancaria,
} from './BaixaAutomaticaDialog.types';
import { BaixaAutomaticaDialogCorrespondenciasAutomaticas } from './BaixaAutomaticaDialogCorrespondenciasAutomaticas';

export function BaixaAutomaticaDialog({
  open,
  onOpenChange,
  empresaId,
}: BaixaAutomaticaDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [unmatched, setUnmatched] = useState<TransacaoBancaria[]>([]);
  const [processing, setProcessing] = useState(false);
  const [summary, setSuccessSummary] = useState({ processados: 0, valor: 0, falhas: 0 });
  const [contaBancariaId, setContaBancariaId] = useState('');

  const queryClient = useQueryClient();
  const { data: contasBancarias = [] } = useContasBancarias(empresaId || undefined);

  const resetState = () => {
    setStep('upload');
    setProgress(0);
    setResultado(null);
    setMatches([]);
    setProcessing(false);
    setContaBancariaId('');
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const findMatches = async (extrato: ExtratoOFX) => {
    // Busca contas a receber pendentes da empresa
    const { data: contas } = await supabase
      .from('contas_receber')
      .select('id, valor, data_vencimento, cliente_nome, status')
      .eq('empresa_id', empresaId)
      .neq('status', 'pago')
      .neq('status', 'cancelado');

    if (!contas) return { matched: [], unmatched: [] };

    const matched: MatchResult[] = [];
    const notMatched: TransacaoBancaria[] = [];

    for (const t of extrato.transacoes) {
      if (t.tipo !== 'credito') continue;

      // Matching simples por valor e data aproximada
      const match = contas.find((c) => {
        const valorMatch = Math.abs(c.valor - t.valor) < 0.05;
        const dataT = new Date(t.data);
        const dataC = new Date(c.data_vencimento);
        const diffDias = Math.abs(dataT.getTime() - dataC.getTime()) / (1000 * 60 * 60 * 24);
        return valorMatch && diffDias <= 5;
      });

      if (match) {
        matched.push({
          transacao: t,
          contaId: match.id,
          cliente: match.cliente_nome ?? '',
          vencimento: match.data_vencimento,
          valor: match.valor,
          confianca: 'alta',
        });
      } else {
        notMatched.push(t);
      }
    }
    return { matched, unmatched: notMatched };
  };

  const processFile = async (file: File) => {
    setStep('processing');
    setProgress(0);
    try {
      const content = await file.text();
      setProgress(50);
      const result = parseExtratoBancario(content, file.name);

      if (result.sucesso && result.extrato) {
        const { matched: foundMatches, unmatched: foundUnmatched } = await findMatches(
          result.extrato
        );
        setMatches(foundMatches);
        setUnmatched(foundUnmatched);
        setResultado(result);
        setProgress(100);
        setStep('preview');
      } else {
        setResultado(result);
        setStep('error');
      }
    } catch (error: unknown) {
      setResultado({
        sucesso: false,
        erro: error instanceof Error ? error.message : String(error),
        avisos: [],
      });
      setStep('error');
    }
  };

  const handleConfirmBaixa = async () => {
    if (!empresaId) {
      toast.error('Selecione uma empresa antes de executar a baixa automática.');
      return;
    }
    setProcessing(true);
    let successCount = 0;
    let totalValue = 0;
    let failCount = 0;

    try {
      for (const m of matches) {
        const { error } = await supabase
          .from('contas_receber')
          .update({
            status: 'pago',
            data_recebimento: toISOLocal(m.transacao.data),
            valor_recebido: m.valor,
          })
          .eq('id', m.contaId);

        if (error) {
          failCount++;
          toast.error(`Falha ao liquidar ${m.cliente}: ${error.message}`);
          continue;
        }

        successCount++;
        totalValue += m.valor;

        // Registra transação bancária confirmada para conciliação.
        // OFX não traz a conta: usa o id escolhido no preview. Sem conta
        // selecionada o lançamento bancário é pulado (padrão do
        // RegistrarRecebimentoDialog), nunca grava '' em coluna uuid.
        if (contaBancariaId) {
          const { error: txError } = await supabase.from('transacoes_bancarias').insert({
            conta_bancaria_id: contaBancariaId,
            data: toISOLocal(m.transacao.data),
            descricao: `BAIXA AUT LOTE: ${m.cliente} - ${m.transacao.descricao}`,
            valor: m.valor,
            tipo: 'receita',
            conciliada: true,
            status: 'confirmado',
            data_confirmacao: new Date().toISOString(),
          });

          if (txError) {
            failCount++;
            toast.error(
              `Falha ao registrar lançamento bancário de ${m.cliente}: ${txError.message}`
            );
          }
        }

        // Registra evidência no log
        try {
          await registrarEventoFinanceiroOrThrow('receber', {
            contaId: m.contaId,
            tipo: 'baixa_automatica',
            mensagem: `Baixa automática realizada via arquivo: ${resultado?.extrato?.nomeArquivo}`,
            metadata: { transacao_banco: m.transacao } as unknown as Json,
          });
        } catch {
          // Falha de auditoria não cancela a baixa, mas não fica silenciosa
          failCount++;
          toast.error(`Falha ao registrar auditoria do título ${m.contaId}.`);
        }
      }

      // Registra alertas para divergências (itens não encontrados)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        for (const t of unmatched) {
          // eslint-disable-next-line local/no-floating-supabase-write -- débito de integridade de escrita, herdado do inventário da Etapa 15
          await supabase.from('alertas').insert({
            user_id: user.id,
            tipo: 'divergencia_baixa',
            prioridade: 'alta',
            titulo: 'Divergência na Baixa Automática',
            mensagem: `Entrada bancária de ${formatCurrency(t.valor)} (${t.descricao}) não encontrou par correspondente no financeiro.`,
          });
        }

        // Registra log global da importação
        // eslint-disable-next-line local/no-floating-supabase-write -- débito de integridade de escrita, herdado do inventário da Etapa 15
        await supabase.from('logs_baixa_automatica').insert([
          {
            user_id: user.id,
            resultado: `Arquivo ${resultado?.extrato?.nomeArquivo || 'unknown'}: ${successCount}/${matches.length} sucesso`,
            mensagem: `Importação concluída`,
            detalhes: {
              arquivo_nome: resultado?.extrato?.nomeArquivo ?? null,
              total_registros: resultado?.extrato?.transacoes.length || 0,
              sucesso_count: successCount,
              falha_count: failCount,
            },
          },
        ]);
      }

      setSuccessSummary({ processados: successCount, valor: totalValue, falhas: failCount });
      if (failCount > 0) {
        toast.error(
          `${failCount} ${failCount === 1 ? 'item não processado' : 'itens não processados'}.`
        );
      }
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      setStep('success');
    } catch (err: unknown) {
      toast.error('Erro ao processar baixa: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'transition-all duration-300',
          step === 'preview' ? 'sm:max-w-2xl' : 'sm:max-w-md'
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Baixa Automática (Arquivo de Retorno)
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' &&
              'Importe o arquivo OFX ou CSV do seu banco para liquidar títulos automaticamente.'}
            {step === 'preview' &&
              `Encontramos ${matches.length} correspondências e ${unmatched.length} divergências que requerem atenção.`}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-4"
            >
              <div
                className={cn(
                  'border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer',
                  dragActive
                    ? 'border-primary bg-primary/5 scale-[1.02]'
                    : 'border-white/10 hover:border-primary/50 hover:bg-card/5'
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('retorno-upload')?.click()}
              >
                <input
                  id="retorno-upload"
                  type="file"
                  accept=".ofx,.csv"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                />
                <div
                  className={cn(
                    'h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-primary/10 text-primary'
                  )}
                >
                  <Upload className="h-8 w-8" />
                </div>
                <p className="font-bold">Arraste o arquivo de retorno aqui</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Suporta OFX (padrão bancário) e CSV
                </p>
              </div>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div key="processing" className="py-12 flex flex-col items-center gap-6">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <div className="text-center">
                <p className="font-bold">Analisando Arquivo...</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Cruzando dados com títulos em aberto
                </p>
              </div>
              <Progress value={progress} className="h-1.5 w-full max-w-[200px]" />
            </motion.div>
          )}

          {step === 'preview' && (
            <motion.div key="preview" className="py-4 space-y-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex gap-3">
                <Info className="h-5 w-5 text-primary shrink-0" />
                <p className="text-xs leading-relaxed">
                  Revise as correspondências automáticas abaixo. As divergências (itens sem par
                  correspondente) serão registradas como alertas para reprocessamento manual.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Landmark className="h-3 w-3" /> Conta Bancária de Destino
                </p>
                <Select value={contaBancariaId} onValueChange={setContaBancariaId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a conta para registrar os lançamentos" />
                  </SelectTrigger>
                  <SelectContent>
                    {contasBancarias.map((cb) => (
                      <SelectItem key={cb.id} value={cb.id}>
                        {cb.banco} - Ag: {cb.agencia} / CC: {cb.conta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  Sem conta selecionada, os títulos são liquidados sem lançamento bancário de
                  conciliação.
                </p>
              </div>

              <BaixaAutomaticaDialogCorrespondenciasAutomaticas
                matches={matches}
                unmatched={unmatched}
              />
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div key="success" className="py-8 text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-success/20 text-success flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-xl font-black italic">Baixa Concluída!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {summary.processados} títulos liquidados com sucesso.
                </p>
                {summary.falhas > 0 && (
                  <p className="text-xs text-warning flex items-center justify-center gap-1 mt-1">
                    <AlertTriangle className="h-3 w-3" />
                    {summary.falhas}{' '}
                    {summary.falhas === 1 ? 'item não processado' : 'itens não processados'} —
                    confira os alertas.
                  </p>
                )}
                <div className="mt-4 p-4 rounded-2xl bg-card/5 border border-white/5 inline-block">
                  <p className="text-[10px] uppercase font-black tracking-widest opacity-40">
                    Volume Recuperado
                  </p>
                  <p className="text-2xl font-black text-primary">
                    {formatCurrency(summary.valor)}
                  </p>
                </div>
              </div>
              <Button onClick={handleClose} className="w-full h-12 rounded-xl mt-4 font-black">
                FECHAR
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {step === 'preview' && (
          <DialogFooter className="gap-2 pt-4">
            <Button variant="outline" onClick={resetState} disabled={processing}>
              CANCELAR
            </Button>
            <Button
              onClick={handleConfirmBaixa}
              disabled={processing}
              className="bg-primary font-black gap-2 h-11 px-8"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              CONFIRMAR BAIXA EM MASSA
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
