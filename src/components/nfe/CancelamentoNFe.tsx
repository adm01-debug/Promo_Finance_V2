import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  CheckCircle2, 
  Wifi, 
  Send, 
  Server,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { processarSefaz, SefazResponse } from '@/lib/sefaz-simulator';
import { registrarEvento } from '@/lib/sefaz-event-logger';
import { toast } from 'sonner';
import { formatCurrency, formatDateTime } from '@/lib/formatters';

// ============================================
// COMPONENTE: MODAL DE CANCELAMENTO DE NF-E
// ============================================

// Using SefazResponse from sefaz-simulator import

interface NotaFiscal {
  id: string;
  numero: string;
  serie: string;
  chaveAcesso: string;
  naturezaOperacao: string;
  dataEmissao: string;
  cnpjEmitente: string;
  emitenteNome: string;
  cnpjDestinatario: string;
  destinatarioNome: string;
  valorTotal: number;
  status: 'autorizada' | 'pendente' | 'cancelada' | 'denegada' | 'inutilizada';
  protocolo?: string;
}

interface CancelamentoNFeProps {
  nota: NotaFiscal;
  onClose: () => void;
  onSuccess: (notaId: string, justificativa: string) => void;
}

export function CancelamentoNFe({ nota, onClose, onSuccess }: CancelamentoNFeProps) {
  const [justificativa, setJustificativa] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [sefazResponse, setSefazResponse] = useState<SefazResponse | null>(null);

  const caracteresMinimos = 15;
  const caracteresRestantes = caracteresMinimos - justificativa.length;

  const steps = [
    { id: 'validating', label: 'Validando', icon: ShieldCheck },
    { id: 'connecting', label: 'Conectando', icon: Wifi },
    { id: 'sending', label: 'Enviando', icon: Send },
    { id: 'processing', label: 'Processando', icon: Server },
    { id: 'done', label: 'Finalizado', icon: CheckCircle2 },
  ];

  const currentIndex = steps.findIndex(s => s.id === currentStep);
  const progress = currentStep ? ((currentIndex + 1) / steps.length) * 100 : 0;

  const handleCancelar = async () => {
    if (justificativa.length < caracteresMinimos) {
      toast.error(`A justificativa deve ter no mínimo ${caracteresMinimos} caracteres`);
      return;
    }

    setIsProcessing(true);
    setSefazResponse(null);
    const tempoInicio = Date.now();

    registrarEvento({
      tipo: 'ENVIO_LOTE',
      chaveAcesso: nota.chaveAcesso,
      numeroNfe: nota.numero,
      cStat: '103',
      xMotivo: 'Solicitação de cancelamento enviada',
      ambiente: 'homologacao',
      tempoResposta: 0,
      detalhes: `Justificativa: ${justificativa}`
    });

    for (const step of steps.slice(0, -1)) {
      setCurrentStep(step.id);
      await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));
    }

    const response = await processarSefaz({
      tipo: 'cancelamento',
      chaveAcesso: nota.chaveAcesso,
      protocolo: nota.protocolo,
      justificativa
    });

    const tempoTotal = Date.now() - tempoInicio;

    registrarEvento({
      tipo: 'CANCELAMENTO',
      chaveAcesso: nota.chaveAcesso,
      numeroNfe: nota.numero,
      cStat: response.cStat,
      xMotivo: response.xMotivo,
      protocolo: response.protocolo,
      ambiente: 'homologacao',
      tempoResposta: tempoTotal,
      detalhes: response.success 
        ? `Cancelamento homologado. Justificativa: ${justificativa}` 
        : `Falha no cancelamento: ${response.errors?.join(', ') || response.xMotivo}`
    });

    setCurrentStep('done');
    setSefazResponse(response);
    setIsProcessing(false);

    if (response.success) {
      toast.success(`NF-e #${nota.numero} cancelada com sucesso!`);
      setTimeout(() => onSuccess(nota.id, justificativa), 1500);
    } else {
      toast.error(`Erro no cancelamento: ${response.xMotivo}`);
    }
  };

  const podeSerCancelada = nota.status === 'autorizada';

  return (
    <div className="space-y-6">
      {/* Informações da NF-e */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">NF-e #{nota.numero}</h3>
            <p className="text-sm text-muted-foreground">Série {nota.serie}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Destinatário</span>
            <p className="font-medium">{nota.destinatarioNome}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Valor Total</span>
            <p className="font-medium">{formatCurrency(nota.valorTotal)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Data de Emissão</span>
            <p className="font-medium">{formatDateTime(nota.dataEmissao)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Protocolo</span>
            <p className="font-mono text-xs">{nota.protocolo}</p>
          </div>
        </div>

        <div className="bg-background rounded p-2 text-xs">
          <span className="text-muted-foreground">Chave de Acesso: </span>
          <code className="font-mono break-all">{nota.chaveAcesso}</code>
        </div>
      </div>

      {/* Aviso */}
      <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-warning">Atenção: Ação Irreversível</p>
          <p className="text-muted-foreground mt-1">
            O cancelamento de NF-e é definitivo e será registrado na SEFAZ. 
            A NF-e só pode ser cancelada em até 24 horas após a autorização.
          </p>
        </div>
      </div>

      {/* Status SEFAZ */}
      <AnimatePresence>
        {(isProcessing || sefazResponse) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-muted/50 rounded-lg p-4 space-y-4"
          >
            <div className="flex items-center gap-2">
              {isProcessing ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              ) : sefazResponse?.success ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <span className="font-medium">
                {isProcessing ? 'Processando cancelamento...' : 
                 sefazResponse?.success ? 'Cancelamento Homologado!' : 'Erro no Cancelamento'}
              </span>
            </div>

            {isProcessing && (
              <>
                <Progress value={progress} className="h-2" />
                <div className="grid grid-cols-5 gap-2">
                  {steps.map((step, idx) => {
                    const StepIcon = step.icon;
                    const isActive = idx === currentIndex;
                    const isDone = idx < currentIndex;
                    return (
                      <div 
                        key={step.id}
                        className={`text-center transition-colors ${
                          isActive ? 'text-primary' : isDone ? 'text-success' : 'text-muted-foreground'
                        }`}
                      >
                        <StepIcon className={`h-4 w-4 mx-auto mb-1 ${isActive ? 'animate-pulse' : ''}`} />
                        <span className="text-xs">{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {sefazResponse && (
              <div className={`rounded-lg p-3 ${sefazResponse.success ? 'bg-success/10 border border-success/20' : 'bg-destructive/10 border border-destructive/20'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className={sefazResponse.success ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}>
                    cStat: {sefazResponse.cStat}
                  </Badge>
                  <span className="text-sm font-medium">{sefazResponse.xMotivo}</span>
                </div>
                {sefazResponse.protocolo && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Protocolo de Cancelamento: </span>
                    <code className="font-mono text-xs">{sefazResponse.protocolo}</code>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Justificativa */}
      {!sefazResponse?.success && (
        <div className="space-y-2">
          <Label htmlFor="justificativa">
            Justificativa do Cancelamento <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="justificativa"
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            placeholder="Informe o motivo do cancelamento (mínimo 15 caracteres)"
            className="min-h-[100px]"
            disabled={isProcessing}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {caracteresRestantes > 0 
                ? `Faltam ${caracteresRestantes} caracteres` 
                : `${justificativa.length} caracteres`}
            </span>
            <span>Mínimo: {caracteresMinimos} caracteres</span>
          </div>
        </div>
      )}

      {/* Botões */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button 
          variant="outline" 
          onClick={onClose}
          disabled={isProcessing}
        >
          {sefazResponse?.success ? 'Fechar' : 'Voltar'}
        </Button>
        
        {!sefazResponse?.success && (
          <Button
            variant="destructive"
            onClick={handleCancelar}
            disabled={isProcessing || justificativa.length < caracteresMinimos || !podeSerCancelada}
            className="gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Cancelando...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                Confirmar Cancelamento
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
