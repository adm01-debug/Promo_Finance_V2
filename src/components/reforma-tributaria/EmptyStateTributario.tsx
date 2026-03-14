// ============================================
// EMPTY STATES COM CTAs - REFORMA TRIBUTÁRIA
// Estados vazios com orientação ao usuário
// ============================================

import { motion } from 'framer-motion';
import { 
  FileText, Calculator, TrendingUp, Shield, AlertTriangle,
  Plus, ArrowRight, Lightbulb, Rocket, Target, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type EmptyStateType = 
  | 'apuracoes'
  | 'creditos'
  | 'operacoes'
  | 'alertas'
  | 'conciliacao'
  | 'onboarding';

interface EmptyStateConfig {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  primaryAction: {
    label: string;
    icon: React.ElementType;
  };
  secondaryAction?: {
    label: string;
    icon: React.ElementType;
  };
  tips?: string[];
}

const EMPTY_STATES: Record<EmptyStateType, EmptyStateConfig> = {
  apuracoes: {
    icon: Calculator,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    title: 'Nenhuma apuração encontrada',
    description: 'Crie sua primeira apuração tributária para começar a calcular CBS, IBS e tributos residuais.',
    primaryAction: { label: 'Criar Apuração', icon: Plus },
    secondaryAction: { label: 'Importar Dados', icon: ArrowRight },
    tips: [
      'Apurações são mensais e devem ser transmitidas até o dia 25',
      'Créditos são calculados automaticamente a partir das NF-e de entrada',
    ],
  },
  creditos: {
    icon: TrendingUp,
    iconColor: 'text-success',
    iconBg: 'bg-success/10',
    title: 'Nenhum crédito tributário',
    description: 'Os créditos são gerados automaticamente quando você importa NF-e de compras ou registra operações de entrada.',
    primaryAction: { label: 'Importar XML', icon: Plus },
    secondaryAction: { label: 'Registrar Manual', icon: FileText },
    tips: [
      'CBS e IBS têm crédito amplo - todo imposto pago gera crédito',
      'Créditos acumulados podem ser ressarcidos em até 60 dias',
    ],
  },
  operacoes: {
    icon: FileText,
    iconColor: 'text-accent-foreground',
    iconBg: 'bg-accent',
    title: 'Nenhuma operação registrada',
    description: 'Registre operações de compra, venda, serviços ou importação para calcular os tributos automaticamente.',
    primaryAction: { label: 'Nova Operação', icon: Plus },
    secondaryAction: { label: 'Importar Lote', icon: ArrowRight },
    tips: [
      'Operações de exportação são imunes a CBS e IBS',
      'Serviços seguem regras específicas de local de tributação',
    ],
  },
  alertas: {
    icon: Shield,
    iconColor: 'text-success',
    iconBg: 'bg-success/10',
    title: 'Tudo em dia! 🎉',
    description: 'Não há alertas pendentes. Continue mantendo suas obrigações em dia.',
    primaryAction: { label: 'Ver Cronograma', icon: Target },
    tips: [
      'Configure notificações para receber lembretes de vencimentos',
      'Execute auditorias periódicas para prevenir problemas',
    ],
  },
  conciliacao: {
    icon: Shield,
    iconColor: 'text-warning',
    iconBg: 'bg-warning/10',
    title: 'Conciliação não executada',
    description: 'Execute a conciliação para verificar se os valores calculados estão corretos em relação às NF-e emitidas.',
    primaryAction: { label: 'Executar Conciliação', icon: Zap },
    tips: [
      'A conciliação cruza NF-e com os cálculos tributários',
      'Divergências são sinalizadas para correção antes da transmissão',
    ],
  },
  onboarding: {
    icon: Rocket,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    title: 'Bem-vindo à Reforma Tributária!',
    description: 'Configure seu módulo em poucos passos para começar a gerenciar CBS, IBS e demais tributos.',
    primaryAction: { label: 'Iniciar Configuração', icon: ArrowRight },
    tips: [
      '1. Cadastre sua empresa com CNPJ e regime tributário',
      '2. Importe NF-e de entrada para gerar créditos',
      '3. Crie sua primeira apuração mensal',
    ],
  },
};

interface Props {
  type: EmptyStateType;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
}

export function EmptyStateTributario({ type, onPrimaryAction, onSecondaryAction }: Props) {
  const config = EMPTY_STATES[type];
  const Icon = config.icon;
  const PrimaryIcon = config.primaryAction.icon;
  const SecondaryIcon = config.secondaryAction?.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-dashed">
        <CardContent className="pt-12 pb-10">
          <div className="flex flex-col items-center text-center max-w-md mx-auto">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className={`w-20 h-20 rounded-2xl ${config.iconBg} flex items-center justify-center mb-6`}
            >
              <Icon className={`h-10 w-10 ${config.iconColor}`} />
            </motion.div>

            {/* Title */}
            <h3 className="text-xl font-semibold mb-2">{config.title}</h3>
            
            {/* Description */}
            <p className="text-muted-foreground mb-6">{config.description}</p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Button 
                size="lg" 
                onClick={onPrimaryAction}
                className="gap-2 shadow-md hover:shadow-lg transition-shadow"
              >
                <PrimaryIcon className="h-4 w-4" />
                {config.primaryAction.label}
              </Button>
              
              {config.secondaryAction && SecondaryIcon && (
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={onSecondaryAction}
                  className="gap-2"
                >
                  <SecondaryIcon className="h-4 w-4" />
                  {config.secondaryAction.label}
                </Button>
              )}
            </div>

            {/* Tips */}
            {config.tips && config.tips.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="w-full p-4 rounded-lg bg-muted/50"
              >
                <div className="flex items-start gap-2 text-left">
                  <Lightbulb className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Dicas:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {config.tips.map((tip, i) => (
                        <li key={i}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default EmptyStateTributario;
