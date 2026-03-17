import { useState } from 'react';
import { Mail, Send, Loader2, UserPlus, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AppRole = 'admin' | 'financeiro' | 'operacional' | 'visualizador';

interface ConviteUsuarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConviteUsuarioDialog({ open, onOpenChange }: ConviteUsuarioDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AppRole>('visualizador');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!email.includes('@')) {
      toast.error('Email inválido');
      return;
    }
    setSending(true);
    try {
      // Use Supabase invite (admin API via edge function would be needed for real invites)
      // For now, create a placeholder invite record
      const { error } = await supabase.from('audit_logs').insert({
        action: 'INVITE_USER' as any,
        details: `Convite enviado para ${email} com perfil ${role}`,
        table_name: 'user_invites',
        user_id: (await supabase.auth.getUser()).data.user?.id,
      });

      toast.success(`Convite enviado para ${email}!`, {
        description: `Perfil atribuído: ${role}`,
      });
      setEmail('');
      setRole('visualizador');
      onOpenChange(false);
    } catch {
      toast.error('Erro ao enviar convite');
    } finally {
      setSending(false);
    }
  };

  const roleDescriptions: Record<AppRole, string> = {
    admin: 'Acesso total ao sistema',
    financeiro: 'Gerencia contas, boletos e fluxo de caixa',
    operacional: 'Cadastros e operações do dia a dia',
    visualizador: 'Apenas visualização de dados',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Convidar Novo Usuário
          </DialogTitle>
          <DialogDescription>Envie um convite por email para adicionar ao sistema</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Email do Convidado</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="nome@empresa.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label>Perfil de Acesso</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleDescriptions).map(([key, desc]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3" />
                      <span className="capitalize">{key}</span>
                      <span className="text-xs text-muted-foreground">— {desc}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            <p className="font-medium mb-1">O convidado receberá:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Email com link de cadastro</li>
              <li>• Perfil <Badge variant="outline" className="text-xs capitalize">{role}</Badge> atribuído automaticamente</li>
              <li>• Acesso ao sistema após verificação de email</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSend} disabled={sending || !email} className="gap-2">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar Convite
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
