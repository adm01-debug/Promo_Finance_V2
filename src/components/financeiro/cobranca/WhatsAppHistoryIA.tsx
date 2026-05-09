import { useState } from 'react';
import {
  MessageSquare,
  Send,
  User,
  Bot,
  Loader2,
  TrendingUp,
  Smile,
  Frown,
  Meh,
  AlertTriangle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useWhatsAppConversas, useSendMessage } from '@/hooks/useWhatsAppIA';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface WhatsAppHistoryProps {
  clienteId: string;
  clienteNome: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WhatsAppHistoryIA({ clienteId, clienteNome, open, onOpenChange }: WhatsAppHistoryProps) {
  const { data: conversas, isLoading } = useWhatsAppConversas(clienteId);
  const sendMessage = useSendMessage();
  const [mensagem, setMensagem] = useState('');

  const handleSend = () => {
    if (!mensagem.trim()) return;
    sendMessage.mutate({ clienteId, mensagem }, {
      onSuccess: () => setMensagem('')
    });
  };

  const getSentimentoIcon = (sentimento: string) => {
    switch (sentimento) {
      case 'positivo': return <Smile className="h-3 w-3 text-success" />;
      case 'negativo': return <Frown className="h-3 w-3 text-destructive" />;
      case 'agressivo': return <AlertTriangle className="h-3 w-3 text-destructive" />;
      default: return <Meh className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="truncate">{clienteNome}</DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                <Bot className="h-3 w-3" /> Monitoramento de IA Ativo
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {conversas?.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[80%] space-y-1",
                    msg.direcao === 'saida' ? "ml-auto items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "p-3 rounded-2xl text-sm",
                      msg.direcao === 'saida'
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-accent rounded-tl-none"
                    )}
                  >
                    {msg.mensagem}
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(msg.created_at), 'HH:mm')}
                    </span>
                    {msg.sentimento && (
                      <Badge variant="outline" className="p-0 h-4 gap-1 text-[10px] border-none">
                        {getSentimentoIcon(msg.sentimento)}
                        {msg.sentimento}
                      </Badge>
                    )}
                    {msg.intencao_pagamento && (
                      <Badge variant="secondary" className="h-4 text-[10px] bg-success/20 text-success border-success/30">
                        <TrendingUp className="h-2 w-2 mr-1" /> Intenção de Pago
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {conversas?.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-10">
                  Nenhuma conversa registrada ainda.
                </p>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t bg-accent/30">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
          >
            <Input
              placeholder="Digite uma mensagem..."
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              disabled={sendMessage.isPending}
            />
            <Button size="icon" type="submit" disabled={sendMessage.isPending || !mensagem.trim()}>
              {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
