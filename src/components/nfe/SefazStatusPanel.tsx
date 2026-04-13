import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, XCircle, AlertCircle, ShieldCheck, Wifi, Send, Server } from 'lucide-react';
import { SefazResponse } from '@/lib/sefaz-simulator';

interface SefazStatusPanelProps {
  isProcessing: boolean;
  currentStep: string;
  response: SefazResponse | null;
}

export function SefazStatusPanel({ isProcessing, currentStep, response }: SefazStatusPanelProps) {
  const steps = [
    { id: 'validating', label: 'Validando dados', icon: ShieldCheck },
    { id: 'connecting', label: 'Conectando à SEFAZ', icon: Wifi },
    { id: 'sending', label: 'Enviando NF-e', icon: Send },
    { id: 'processing', label: 'Processando resposta', icon: Server },
    { id: 'done', label: 'Finalizado', icon: CheckCircle2 },
  ];

  const currentIndex = steps.findIndex(s => s.id === currentStep);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  if (!isProcessing && !response) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-muted/50 rounded-lg p-4 space-y-4"
    >
      <div className="flex items-center gap-2">
        {isProcessing ? (
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
        ) : response?.success ? (
          <CheckCircle2 className="h-5 w-5 text-success" />
        ) : (
          <XCircle className="h-5 w-5 text-destructive" />
        )}
        <span className="font-medium">
          {isProcessing ? 'Comunicando com SEFAZ...' :
           response?.success ? 'NF-e Autorizada!' : 'Erro na Autorização'}
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

      {response && (
        <div className={`rounded-lg p-3 ${response.success ? 'bg-success/10 border border-success/20' : 'bg-destructive/10 border border-destructive/20'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className={response.success ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}>
              cStat: {response.cStat}
            </Badge>
            <span className="text-sm font-medium">{response.xMotivo}</span>
          </div>
          {response.chaveAcesso && (
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Chave:</span>
                <code className="font-mono text-xs bg-background px-2 py-1 rounded">{response.chaveAcesso}</code>
              </div>
              {response.protocolo && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Protocolo:</span>
                  <code className="font-mono text-xs">{response.protocolo}</code>
                </div>
              )}
            </div>
          )}
          {response.errors && response.errors.length > 0 && (
            <div className="mt-2 space-y-1">
              {response.errors.map((err, idx) => (
                <p key={idx} className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {err}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
