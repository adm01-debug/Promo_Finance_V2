import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Copy, Check, Loader2, Zap, Bell, FileText, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ExpertAction } from '@/hooks/useExpertActions';

interface LocalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: ExpertAction[];
  actionsExecuted?: boolean;
}

interface ExpertChatMessagesProps {
  messages: LocalMessage[];
  scrollRef: React.RefObject<HTMLDivElement>;
  copiedId: string | null;
  executingActions: string | null;
  onCopy: (text: string, id: string) => void;
  onExecuteActions: (messageId: string, actions: ExpertAction[]) => void;
}

const getActionLabel = (action: ExpertAction): string => {
  switch (action.type) {
    case 'criar_alerta': return `Criar alerta: ${action.titulo}`;
    case 'gerar_relatorio': return `Gerar relatório: ${action.relatorio}`;
    case 'listar_aprovacoes': return 'Listar aprovações pendentes';
    case 'aprovar_pagamento': return `Aprovar pagamento ${action.id}`;
    case 'navegar': return `Ir para ${action.pagina}`;
    default: return 'Executar ação';
  }
};

const getActionIcon = (action: ExpertAction) => {
  switch (action.type) {
    case 'criar_alerta': return Bell;
    case 'gerar_relatorio': return FileText;
    case 'listar_aprovacoes': case 'aprovar_pagamento': return CheckCircle;
    case 'navegar': return ExternalLink;
    default: return Zap;
  }
};

export function ExpertChatMessages({ messages, scrollRef, copiedId, executingActions, onCopy, onExecuteActions }: ExpertChatMessagesProps) {
  return (
    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
      <div className="space-y-4 max-w-3xl mx-auto">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={cn("flex gap-3", message.role === 'user' ? 'justify-end' : 'justify-start')}>
              {message.role === 'assistant' && (
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-primary-foreground" /></div>
              )}
              <div className={cn("max-w-[80%] rounded-2xl px-4 py-3 relative group", message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                <div className="whitespace-pre-wrap text-sm">
                  {message.content || (<div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /><span>Pensando...</span></div>)}
                </div>
                {message.role === 'assistant' && message.actions && message.actions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Zap className="h-3 w-3" />{message.actionsExecuted ? 'Ações executadas' : 'Ações disponíveis'}</p>
                    <div className="flex flex-wrap gap-2">
                      {message.actions.map((action, idx) => {
                        const ActionIcon = getActionIcon(action);
                        return (
                          <Button key={idx} size="sm" variant={message.actionsExecuted ? "ghost" : "secondary"} disabled={message.actionsExecuted || executingActions === message.id} onClick={() => onExecuteActions(message.id, [action])} className="text-xs">
                            {executingActions === message.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : message.actionsExecuted ? <Check className="h-3 w-3 mr-1 text-success" /> : <ActionIcon className="h-3 w-3 mr-1" />}
                            {getActionLabel(action)}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {message.role === 'assistant' && message.content && (
                  <button onClick={() => onCopy(message.content, message.id)} className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-background border shadow-sm hover:bg-muted">
                    {copiedId === message.id ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                  </button>
                )}
              </div>
              {message.role === 'user' && (<div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0"><User className="h-4 w-4 text-secondary-foreground" /></div>)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
}
