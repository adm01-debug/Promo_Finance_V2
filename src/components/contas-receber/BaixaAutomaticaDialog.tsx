import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { parseExtratoBancario, ExtratoOFX, ResultadoImportacao } from '@/lib/ofx-parser';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface BaixaAutomaticaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId: string;
}

type Step = 'upload' | 'processing' | 'preview' | 'success' | 'error';

interface MatchResult {
  transacao: any;
  contaId: string;
  cliente: string;
  vencimento: string;
  valor: number;
  confianca: 'alta' | 'media' | 'baixa';
}

export function BaixaAutomaticaDialog({ open, onOpenChange, empresaId }: BaixaAutomaticaDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [summary, setSuccessSummary] = useState({ processados: 0, valor: 0 });
  
  const queryClient = useQueryClient();

  const resetState = () => {
    setStep('upload');
    setProgress(0);
    setResultado(null);
    setMatches([]);
    setProcessing(false);
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

    if (!contas) return [];

    const matched: MatchResult[] = [];
    
    for (const t of extrato.transacoes) {
      if (t.tipo !== 'credito') continue;

      // Matching simples por valor e data aproximada
      const match = contas.find(c => {
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
          cliente: match.cliente_nome,
          vencimento: match.data_vencimento,
          valor: match.valor,
          confianca: 'alta'
        });
      }
    }
    return matched;
  };

  const processFile = async (file: File) => {
    setStep('processing');
    setProgress(0);
    try {
      const content = await file.text();
      setProgress(50);
      const result = parseExtratoBancario(content, file.name);
      
      if (result.sucesso && result.extrato) {
        const foundMatches = await findMatches(result.extrato);
        setMatches(foundMatches);
        setResultado(result);
        setProgress(100);
        setStep('preview');
      } else {
        setResultado(result);
        setStep('error');
      }
    } catch (error: any) {
      setResultado({ sucesso: false, erro: error.message, avisos: [] });
      setStep('error');
    }
  };

  const handleConfirmBaixa = async () => {
    setProcessing(true);
    let successCount = 0;
    let totalValue = 0;

    try {
      for (const m of matches) {
        const { error } = await supabase
          .from('contas_receber')
          .update({
            status: 'pago',
            data_recebimento: m.transacao.data.toISOString().split('T')[0],
            valor_recebido: m.valor
          })
          .eq('id', m.contaId);

        if (!error) {
          successCount++;
          totalValue += m.valor;
          
          // Registra evidência no log (através do trigger ou manual se necessário)
          await supabase.rpc('registrar_evento_receber', {
            p_conta_id: m.contaId,
            p_tipo: 'baixa_automatica',
            p_mensagem: `Baixa automática realizada via arquivo: ${resultado?.extrato?.nomeArquivo}`,
            p_metadata: { transacao_banco: m.transacao }
          });
        }
      }

      // Registra log global da importação
      await (supabase.from('logs_baixa_automatica') as any).insert({
        empresa_id: empresaId,
        arquivo_nome: resultado?.extrato?.nomeArquivo || 'unknown',
        total_registros: resultado?.extrato?.transacoes.length || 0,
        sucesso_count: successCount,
        falha_count: matches.length - successCount,
        matching_info: { matches }
      });

      setSuccessSummary({ processados: successCount, valor: totalValue });
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      setStep('success');
    } catch (err: any) {
      toast.error('Erro ao processar baixa: ' + err.message);
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
      <DialogContent className={cn("transition-all duration-300", step === 'preview' ? "sm:max-w-2xl" : "sm:max-w-md")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Baixa Automática (Arquivo de Retorno)
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Importe o arquivo OFX ou CSV do seu banco para liquidar títulos automaticamente.'}
            {step === 'preview' && `Encontramos ${matches.length} correspondências de alta confiança.`}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-4">
              <div 
                className={cn(
                  "border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer",
                  dragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-white/10 hover:border-primary/50 hover:bg-white/5"
                )}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                onClick={() => document.getElementById('retorno-upload')?.click()}
              >
                <input id="retorno-upload" type="file" accept=".ofx,.csv" className="hidden" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
                <div className={cn("h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-primary/10 text-primary")}>
                  <Upload className="h-8 w-8" />
                </div>
                <p className="font-bold">Arraste o arquivo de retorno aqui</p>
                <p className="text-xs text-muted-foreground mt-1">Suporta OFX (padrão bancário) e CSV</p>
              </div>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div key="processing" className="py-12 flex flex-col items-center gap-6">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <div className="text-center">
                <p className="font-bold">Analisando Arquivo...</p>
                <p className="text-xs text-muted-foreground mt-1">Cruzando dados com títulos em aberto</p>
              </div>
              <Progress value={progress} className="h-1.5 w-full max-w-[200px]" />
            </motion.div>
          )}

          {step === 'preview' && (
            <motion.div key="preview" className="py-4 space-y-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex gap-3">
                <Info className="h-5 w-5 text-primary shrink-0" />
                <p className="text-xs leading-relaxed">
                  Os títulos abaixo possuem <strong>valor idêntico</strong> e data de vencimento em um raio de <strong>5 dias</strong> da transação bancária.
                </p>
              </div>
              
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {matches.map((m, i) => (
                  <div key={i} className="p-3 rounded-lg border border-white/5 bg-white/5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{m.cliente}</p>
                      <p className="text-muted-foreground">Venc: {formatDate(m.vencimento)} • {m.transacao.descricao}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-primary">{formatCurrency(m.valor)}</p>
                      <Badge variant="outline" className="text-[8px] bg-success/20 text-success border-none h-4">MATCH ALTO</Badge>
                    </div>
                  </div>
                ))}
              </div>
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
                <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/5 inline-block">
                  <p className="text-[10px] uppercase font-black tracking-widest opacity-40">Volume Recuperado</p>
                  <p className="text-2xl font-black text-primary">{formatCurrency(summary.valor)}</p>
                </div>
              </div>
              <Button onClick={handleClose} className="w-full h-12 rounded-xl mt-4 font-black">FECHAR</Button>
            </motion.div>
          )}
        </AnimatePresence>

        {step === 'preview' && (
          <DialogFooter className="gap-2 pt-4">
            <Button variant="outline" onClick={resetState} disabled={processing}>CANCELAR</Button>
            <Button onClick={handleConfirmBaixa} disabled={processing} className="bg-primary font-black gap-2 h-11 px-8">
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              CONFIRMAR BAIXA EM MASSA
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
