import { useEffect, useState } from 'react';
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
import { conciliarCreditos, ehMesmoPagador } from '@/lib/financeiro/conciliacao-extrato';
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
import type { ContaCandidata } from './VincularManualmenteDialog';
import {
  mesclarPendentes,
  origemDoExtrato,
  type DivergenciaPendente,
} from '@/lib/financeiro/divergencias-pendentes';

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
  const [summary, setSuccessSummary] = useState({
    processados: 0,
    valor: 0,
    falhas: 0,
    falhasAuxiliares: 0,
    alertasFalhos: 0,
  });
  const [contaBancariaId, setContaBancariaId] = useState('');
  // Conta de origem do extrato em análise (ACCTID do arquivo). Identifica o
  // crédito nas pendências; sem ela a fila não deduplica nada.
  const [origemDoLote, setOrigemDoLote] = useState<string | null>(null);
  const [empresaDoLote, setEmpresaDoLote] = useState('');
  // Divergências cujo alerta não pôde ser gravado: ficam na tela para nova
  // tentativa. Reimportar o arquivo inteiro não é a saída — os créditos já
  // liquidados continuam no extrato e poderiam quitar outros títulos.
  // Cada pendência guarda a empresa do lote de origem: sem isso, trocar de empresa
  // antes de repetir a gravação criava o alerta na empresa errada.
  const [divergenciasSemAlerta, setDivergenciasSemAlerta] = useState<DivergenciaPendente[]>([]);

  // Pendências de outro lote/empresa continuam válidas e serão gravadas na empresa
  // de origem — a tela avisa para o usuário não estranhar o número.
  const pendentesDeOutraEmpresa = divergenciasSemAlerta.filter(
    (d) => d.empresaId !== empresaId
  ).length;

  const queryClient = useQueryClient();
  const { data: contasBancarias = [] } = useContasBancarias(empresaId || undefined);

  const resetState = () => {
    setStep('upload');
    setProgress(0);
    setResultado(null);
    setMatches([]);
    setUnmatched([]);
    setProcessing(false);
    setContaBancariaId('');
    setOrigemDoLote(null);
    setEmpresaDoLote('');
    // `divergenciasSemAlerta` sobrevive ao fechamento: são alertas que não
    // entraram no banco e continuam devidos. Só saem daqui quando gravados.
  };

  useEffect(() => {
    if (!empresaDoLote || !empresaId || empresaId === empresaDoLote) return;
    resetState();
    // As pendências continuam: carregam a empresa de origem e são gravadas nela.
    toast.error('Empresa alterada — importe novamente o arquivo de retorno desta empresa.');
  }, [empresaId, empresaDoLote]);

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
      .neq('status', 'recebido')
      .neq('status', 'cancelado');

    if (!contas) return { matched: [], unmatched: [] };

    const creditos = extrato.transacoes.filter((t) => t.tipo === 'credito');
    // Valor e vencimento sozinhos não dizem quem pagou: os títulos são
    // decididos em conjunto para um crédito nunca quitar o título de outro
    // cliente (vínculo ambíguo vira divergência, resolvida na vinculação
    // manual do preview).
    const titulos = conciliarCreditos(creditos, contas);

    const matched: MatchResult[] = [];
    const notMatched: TransacaoBancaria[] = [];

    creditos.forEach((t, indice) => {
      const titulo = titulos[indice];
      if (!titulo) {
        notMatched.push(t);
        return;
      }

      matched.push({
        transacao: t,
        contaId: titulo.id,
        cliente: titulo.cliente_nome ?? '',
        vencimento: titulo.data_vencimento,
        valor: Number(titulo.valor ?? 0),
        // Sem o nome do pagador no extrato, o vínculo se apoia só em valor e
        // vencimento — a confiança exibida precisa dizer isso.
        confianca: ehMesmoPagador(t, titulo) ? 'alta' : 'media',
      });
    });

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
        setEmpresaDoLote(empresaId);
        setOrigemDoLote(origemDoExtrato(result.extrato));
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

  const handleVincularManual = (transacao: TransacaoBancaria, conta: ContaCandidata) => {
    if (matches.some((m) => m.contaId === conta.id)) {
      toast.error(
        `${conta.cliente_nome ?? 'Título'} já está vinculado a outro crédito deste lote.`
      );
      return;
    }
    setMatches((prev) => [
      ...prev,
      {
        transacao,
        contaId: conta.id,
        cliente: conta.cliente_nome ?? '',
        vencimento: conta.data_vencimento,
        valor: conta.valor,
        confianca: 'manual',
      },
    ]);
    setUnmatched((prev) => prev.filter((t) => t !== transacao));
  };

  // Grava os alertas de divergência e devolve o que não pôde ser registrado,
  // para a tela de conclusão oferecer nova tentativa só desses itens.
  const registrarDivergencias = async (
    userId: string,
    pendentes: DivergenciaPendente[]
  ): Promise<DivergenciaPendente[]> => {
    const falhas: DivergenciaPendente[] = [];
    for (const pendente of pendentes) {
      const { empresaId: empresaAlvo, transacao: t } = pendente;
      const { error: alertaError } = await supabase.from('alertas').insert({
        user_id: userId,
        // A empresa do lote vai explícita: sem ela o gatilho de alertas usa
        // a empresa do perfil, que pode ser outra que não a selecionada.
        empresa_id: empresaAlvo,
        tipo: 'divergencia_baixa',
        prioridade: 'alta',
        titulo: 'Divergência na Baixa Automática',
        mensagem: `Entrada bancária de ${formatCurrency(t.valor)} (${t.descricao}) não encontrou par correspondente no financeiro.`,
      });
      // A pendência volta inteira: sem a conta de origem a fila não reconhece
      // que o crédito já devia um alerta e duplicaria o registro.
      if (alertaError) falhas.push(pendente);
    }
    return falhas;
  };

  const handleConfirmBaixa = async () => {
    if (!empresaId) {
      toast.error('Selecione uma empresa antes de executar a baixa automática.');
      return;
    }
    if (empresaDoLote && empresaDoLote !== empresaId) {
      toast.error('A empresa mudou desde a importação. Importe o arquivo de retorno novamente.');
      resetState();
      return;
    }
    const empresaAlvo = empresaDoLote || empresaId;
    setProcessing(true);
    let successCount = 0;
    let totalValue = 0;
    let failCount = 0;
    // Etapas auxiliares (lançamento bancário/auditoria) falham SEM desfazer a
    // liquidação — o título foi processado e não pode contar como "não
    // processado" (dedupe por título: 1 líquidação = 1 falha máxima).
    let auxFailCount = 0;
    // Divergências que não puderam virar alerta: sem o alerta o usuário não
    // tem onde reencontrá-las depois que a tela de conclusão abre.
    let alertasFalhos = 0;
    // Créditos cuja liquidação não pôde ser confirmada (título já liquidado ou
    // valor alterado entre a leitura e a escrita) precisam virar divergência,
    // senão o lote termina sem lançamento bancário e sem alerta de reprocesso.
    const naoConfirmadas: TransacaoBancaria[] = [];

    try {
      for (const m of matches) {
        const { data: liquidadas, error } = await supabase
          .from('contas_receber')
          .update({
            status: 'pago',
            data_recebimento: toISOLocal(m.transacao.data),
            // O valor liquidado é o que entrou na conta bancária, não o valor
            // nominal do título — a baixa manual só é oferecida para títulos
            // de valor idêntico ao crédito.
            valor_recebido: m.transacao.valor,
            // Mesmo padrão do RegistrarRecebimentoDialog: grava a conta
            // escolhida também no título, para o filtro de contas a receber
            // por banco (useContasReceberPaginated) continuar encontrando o
            // título liquidado. Só quando há conta selecionada — sem seleção
            // preserva o vínculo anterior (nunca grava '' em coluna uuid).
            ...(contaBancariaId ? { conta_bancaria_id: contaBancariaId } : {}),
          })
          .eq('id', m.contaId)
          .eq('empresa_id', empresaAlvo)
          // Revalidação no ato da escrita: o título pode ter sido liquidado
          // (pago/recebido) ou cancelado depois da leitura das candidatas.
          .not('status', 'in', '(pago,recebido,cancelado)')
          // Revalidação do valor: se o título foi editado (aumentado/reduzido)
          // depois da leitura, o crédito selecionado não quita mais o saldo e
          // não pode ser marcado como pago — vira divergência para reprocesso.
          .eq('valor', m.valor)
          .select('id');

        if (error) {
          failCount++;
          naoConfirmadas.push(m.transacao);
          toast.error(`Falha ao liquidar ${m.cliente}: ${error.message}`);
          continue;
        }

        if (!liquidadas || liquidadas.length === 0) {
          failCount++;
          naoConfirmadas.push(m.transacao);
          toast.error(
            `${m.cliente} não foi liquidado: o título já estava pago, recebido ou cancelado, ou o valor foi alterado após a vinculação.`
          );
          continue;
        }

        successCount++;
        totalValue += m.transacao.valor;

        // Registra transação bancária confirmada para conciliação.
        // OFX não traz a conta: usa o id escolhido no preview. Sem conta
        // selecionada o lançamento bancário é pulado (padrão do
        // RegistrarRecebimentoDialog), nunca grava '' em coluna uuid.
        if (contaBancariaId) {
          const { error: txError } = await supabase.from('transacoes_bancarias').insert({
            conta_bancaria_id: contaBancariaId,
            data: toISOLocal(m.transacao.data),
            descricao: `BAIXA AUT LOTE: ${m.cliente} - ${m.transacao.descricao}`,
            valor: m.transacao.valor,
            tipo: 'receita',
            conciliada: true,
            status: 'confirmado',
            data_confirmacao: new Date().toISOString(),
          });

          if (txError) {
            auxFailCount++;
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
          auxFailCount++;
          toast.error(`Falha ao registrar auditoria do título ${m.contaId}.`);
        }
      }

      // Registra alertas para divergências (itens não encontrados)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // A conta de origem vem do arquivo, não do destino escolhido agora: o
        // FITID só identifica o crédito dentro da conta que o emitiu, e trocar o
        // destino entre importações não muda o crédito.
        const novasPendentes = [...unmatched, ...naoConfirmadas].map((transacao) => ({
          empresaId: empresaAlvo,
          origemConta: origemDoLote,
          transacao,
        }));
        const falhasDeAlerta = await registrarDivergencias(user.id, novasPendentes);
        alertasFalhos = falhasDeAlerta.length;
        // Mescla com as pendências de lotes anteriores (mesmo de outra empresa):
        // sobrescrever descartava alertas que continuavam devidos.
        setDivergenciasSemAlerta((prev) => mesclarPendentes(prev, falhasDeAlerta, novasPendentes));
        if (alertasFalhos > 0) {
          // A divergência não pode ficar registrada em lugar nenhum: a tela de
          // conclusão repete só a gravação destes alertas, sem reimportar o
          // arquivo (os créditos já liquidados continuam no extrato e
          // quitariam outros títulos).
          toast.error(
            `${alertasFalhos} ${alertasFalhos === 1 ? 'alerta' : 'alertas'} de divergência não ${
              alertasFalhos === 1 ? 'pôde' : 'puderam'
            } ser registrado(s) — use "REGISTRAR DIVERGÊNCIAS PENDENTES" na tela de conclusão.`
          );
        }

        // Registra log global da importação
        const { error: logError } = await supabase.from('logs_baixa_automatica').insert([
          {
            user_id: user.id,
            resultado: `Arquivo ${resultado?.extrato?.nomeArquivo || 'unknown'}: ${successCount}/${matches.length} sucesso`,
            mensagem: `Importação concluída`,
            detalhes: {
              arquivo_nome: resultado?.extrato?.nomeArquivo ?? null,
              total_registros: resultado?.extrato?.transacoes.length || 0,
              sucesso_count: successCount,
              falha_count: failCount,
              falhas_auxiliares: auxFailCount,
              alertas_falhos: alertasFalhos,
            },
          },
        ]);
        if (logError) {
          auxFailCount++;
          toast.error(`Falha ao registrar o log da importação: ${logError.message}`);
        }
      }

      setSuccessSummary({
        processados: successCount,
        valor: totalValue,
        falhas: failCount,
        falhasAuxiliares: auxFailCount,
        alertasFalhos,
      });
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

  const handleRepetirAlertas = async () => {
    const pendentes = divergenciasSemAlerta;
    if (pendentes.length === 0) return;
    setProcessing(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Sessão expirada — entre novamente para registrar as divergências.');
        return;
      }
      const falhas = await registrarDivergencias(user.id, pendentes);
      setDivergenciasSemAlerta(falhas);
      setSuccessSummary((prev) => ({ ...prev, alertasFalhos: falhas.length }));
      if (falhas.length === 0) {
        toast.success(
          `${pendentes.length} ${pendentes.length === 1 ? 'divergência registrada' : 'divergências registradas'} como alerta.`
        );
      } else {
        toast.error(
          `${falhas.length} ${falhas.length === 1 ? 'divergência continua' : 'divergências continuam'} sem alerta — tente novamente em instantes.`
        );
      }
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
    <Dialog
      open={open}
      onOpenChange={(aberto) => {
        // Fechar pelo X do diálogo precisa descartar o preview — senão um
        // extrato importado para uma empresa fica pendente na tela.
        if (aberto) onOpenChange(true);
        else handleClose();
      }}
    >
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

        {step === 'upload' && divergenciasSemAlerta.length > 0 && (
          <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 space-y-2">
            <p className="text-xs text-warning flex items-start gap-1">
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
              <span>
                {divergenciasSemAlerta.length === 1
                  ? '1 divergência da última baixa continua sem alerta registrado.'
                  : `${divergenciasSemAlerta.length} divergências da última baixa continuam sem alerta registrado.`}{' '}
                Registre-as aqui — reimportar o extrato pode reaplicar créditos já usados.
                {pendentesDeOutraEmpresa > 0 &&
                  ` ${pendentesDeOutraEmpresa} ${
                    pendentesDeOutraEmpresa === 1 ? 'é de outro lote' : 'são de outros lotes'
                  } e ${pendentesDeOutraEmpresa === 1 ? 'será gravada' : 'serão gravadas'} na empresa de origem.`}
              </span>
            </p>
            <Button
              variant="outline"
              onClick={handleRepetirAlertas}
              disabled={processing}
              className="w-full h-10 rounded-xl font-black gap-2"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              REGISTRAR DIVERGÊNCIAS PENDENTES ({divergenciasSemAlerta.length})
            </Button>
          </div>
        )}

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
                empresaId={empresaId}
                onVincular={handleVincularManual}
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
                    {summary.falhas === 1 ? 'título não processado' : 'títulos não processados'} —
                    confira os alertas.
                  </p>
                )}
                {summary.falhasAuxiliares > 0 && (
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                    <Info className="h-3 w-3" />
                    {summary.falhasAuxiliares} etapa
                    {summary.falhasAuxiliares === 1 ? ' auxiliar' : 's auxiliares'} com falha
                    (lançamento bancário/auditoria) — veja os alertas.
                  </p>
                )}
                {summary.alertasFalhos > 0 && (
                  <p className="text-xs text-warning flex items-center justify-center gap-1 mt-1">
                    <AlertTriangle className="h-3 w-3" />
                    {summary.alertasFalhos}{' '}
                    {summary.alertasFalhos === 1
                      ? 'divergência não foi registrada como alerta'
                      : 'divergências não foram registradas como alerta'}{' '}
                    — registre-as com o botão abaixo, sem reimportar o arquivo.
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
              {divergenciasSemAlerta.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleRepetirAlertas}
                  disabled={processing}
                  className="w-full h-12 rounded-xl mt-4 font-black gap-2"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  REGISTRAR DIVERGÊNCIAS PENDENTES ({divergenciasSemAlerta.length})
                </Button>
              )}
              {divergenciasSemAlerta.length > 0 && (
                <p className="text-[10px] mt-2 opacity-60">
                  A lista inclui pendências de outros lotes — cada alerta é gravado na empresa de
                  origem do lote, mesmo que não seja a selecionada agora.
                </p>
              )}
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
