import { motion } from 'framer-motion';
import { Sparkles, Zap, TrendingUp, Lightbulb, FileQuestion, MessageSquare, FileText, Bell, CheckCircle, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const suggestedQuestions = [
  { icon: TrendingUp, label: 'Previsão de Caixa', question: 'Qual a previsão de fluxo de caixa para os próximos 30 dias considerando os títulos em aberto?' },
  { icon: Lightbulb, label: 'Melhorias', question: 'Quais melhorias você sugere para reduzir a inadimplência dos clientes?' },
  { icon: FileQuestion, label: 'Processo de Aprovação', question: 'Como funciona o processo de aprovação de pagamentos acima de R$ 5.000?' },
  { icon: MessageSquare, label: 'Conciliação Bancária', question: 'Quais são as melhores práticas para realizar a conciliação bancária diária?' },
];

const quickActions = [
  { icon: FileText, label: 'Relatório de Caixa', prompt: 'Gere um relatório de fluxo de caixa para os próximos dias' },
  { icon: Bell, label: 'Criar Alerta', prompt: 'Crie um alerta de alta prioridade para revisar as contas a pagar da semana' },
  { icon: CheckCircle, label: 'Ver Aprovações', prompt: 'Liste todas as aprovações de pagamento pendentes' },
  { icon: AlertTriangle, label: 'Inadimplência', prompt: 'Gere um relatório de inadimplência com os títulos vencidos' },
];

interface ExpertWelcomeScreenProps {
  onSendMessage: (message: string) => void;
}

export function ExpertWelcomeScreen({ onSendMessage }: ExpertWelcomeScreenProps) {
  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-6">
          <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 mx-auto">
            <Sparkles className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Olá! Sou o EXPERT</h2>
          <p className="text-muted-foreground max-w-md">Estou aqui para ajudar você a tomar melhores decisões financeiras, prever cenários e esclarecer dúvidas sobre processos.</p>
        </motion.div>

        <div className="w-full max-w-2xl mb-6">
          <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2 justify-center"><Zap className="h-4 w-4" />Ações Rápidas</p>
          <div className="flex flex-wrap justify-center gap-2">
            {quickActions.map((action, index) => (
              <motion.button key={index} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }} onClick={() => onSendMessage(action.prompt)} className="flex items-center gap-2 px-4 py-2 rounded-full border bg-card hover:bg-primary hover:text-primary-foreground text-sm transition-colors">
                <action.icon className="h-4 w-4" />{action.label}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
          {suggestedQuestions.map((item, index) => (
            <motion.button key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + index * 0.1 }} onClick={() => onSendMessage(item.question)} className="flex items-start gap-3 p-4 rounded-xl border bg-card hover:bg-muted/50 text-left transition-colors group">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors"><item.icon className="h-5 w-5 text-primary" /></div>
              <div><p className="font-medium text-sm">{item.label}</p><p className="text-xs text-muted-foreground line-clamp-2">{item.question}</p></div>
            </motion.button>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
