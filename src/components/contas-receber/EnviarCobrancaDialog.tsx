import { useState } from 'react';
import { MessageCircle, Send, Mail, Phone } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ContaReceber {
  id: string;
  cliente_nome: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  status: string;
}

interface EnviarCobrancaDialogProps {
  conta: ContaReceber | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const canais = [
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'bg-success/10 text-success hover:bg-success/20' },
  { id: 'email', label: 'E-mail', icon: Mail, color: 'bg-primary/10 text-primary hover:bg-primary/20' },
  { id: 'sms', label: 'SMS', icon: Phone, color: 'bg-warning/10 text-warning hover:bg-warning/20' },
];

export function EnviarCobrancaDialog({ conta, open, onOpenChange }: EnviarCobrancaDialogProps) {
  const [canal, setCanal] = useState('whatsapp');
  const [mensagem, setMensagem] = useState('');

  if (!conta) return null;

  const mensagemPadrao = `Olá ${conta.cliente_nome}! Informamos que o título "${conta.descricao}" no valor de ${formatCurrency(conta.valor)}, com vencimento em ${formatDate(conta.data_vencimento)}, encontra-se pendente. Por favor, regularize o pagamento. Agradecemos!`;

  const handleEnviar = () => {
    const textoFinal = mensagem || mensagemPadrao;
    
    if (canal === 'whatsapp') {
      const encoded = encodeURIComponent(textoFinal);
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
      toast.success('Redirecionando para o WhatsApp...');
    } else if (canal === 'email') {
      const subject = encodeURIComponent(`Cobrança - ${conta.descricao}`);
      const body = encodeURIComponent(textoFinal);
      window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
      toast.success('Abrindo cliente de e-mail...');
    } else {
      toast.info('SMS: funcionalidade em desenvolvimento');
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-display">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Send className="h-5 w-5 text-primary" />
            </div>
            Enviar Cobrança
          </DialogTitle>
          <DialogDescription>
            <div className="mt-3 p-3 rounded-lg bg-muted/50">
              <p className="font-medium text-foreground">{conta.cliente_nome}</p>
              <p className="text-sm">{conta.descricao} • {formatCurrency(conta.valor)}</p>
              <p className="text-xs mt-1">Vencimento: {formatDate(conta.data_vencimento)}</p>
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Canal Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Canal de Envio</label>
          <div className="flex gap-2">
            {canais.map(c => {
              const Icon = c.icon;
              return (
                <Button
                  key={c.id}
                  type="button"
                  variant="outline"
                  className={cn("flex-1 gap-2 transition-all", canal === c.id && c.color)}
                  onClick={() => setCanal(c.id)}
                >
                  <Icon className="h-4 w-4" />
                  {c.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Mensagem</label>
          <Textarea
            value={mensagem}
            onChange={e => setMensagem(e.target.value)}
            placeholder={mensagemPadrao}
            className="min-h-[120px]"
          />
          <p className="text-xs text-muted-foreground">Deixe vazio para usar a mensagem padrão</p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="gap-2" onClick={handleEnviar}>
            <Send className="h-4 w-4" /> Enviar via {canais.find(c => c.id === canal)?.label}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
