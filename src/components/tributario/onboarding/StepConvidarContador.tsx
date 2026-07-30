import { useState } from 'react';
import { Loader2, Mail, SkipForward, UserPlus, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const Schema = z.object({
  email: z.string().trim().email('E-mail inválido').max(255),
  nome: z.string().trim().max(120).optional(),
});

interface Props {
  empresaId: string;
  onConcluir: () => void;
  onPular: () => void;
}

export function StepConvidarContador({ empresaId, onConcluir, onPular }: Props) {
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleEnviar = async () => {
    const parsed = Schema.safeParse({ email, nome });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setEnviando(true);
    try {
      const { data, error } = await supabase.functions.invoke('convidar-contador', {
        body: {
          empresa_id: empresaId,
          email: parsed.data.email,
          nome: parsed.data.nome,
          origin: window.location.origin,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Falha ao convidar');
      setEnviado(true);
      toast.success(data.email_sent ? 'Convite enviado por e-mail' : 'Convite criado (e-mail não enviado)');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar convite');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          4. Convidar contador (opcional)
        </CardTitle>
        <CardDescription>
          Envie um link de acesso somente leitura para o seu contador acompanhar a empresa. Validade de 30 dias.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="contador-nome">Nome (opcional)</Label>
            <Input
              id="contador-nome"
              placeholder="João da Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={enviado}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contador-email">E-mail</Label>
            <Input
              id="contador-email"
              type="email"
              placeholder="contador@escritorio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={enviado}
            />
          </div>
        </div>

        {enviado && (
          <div className="rounded-md border border-success/30 bg-success/10 p-3 text-sm flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
            <div>
              <p className="font-medium text-success">Convite enviado</p>
              <p className="text-muted-foreground text-xs">
                O contador receberá o link em {email}. Você pode revogar o acesso depois em Configurações.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-between gap-2 pt-2">
          <Button variant="ghost" onClick={onPular}>
            <SkipForward className="h-4 w-4" /> Pular esta etapa
          </Button>
          <div className="flex gap-2">
            {!enviado ? (
              <Button onClick={handleEnviar} disabled={enviando || !email}>
                {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Enviar convite
              </Button>
            ) : (
              <Button variant="premium" onClick={onConcluir}>
                <CheckCircle2 className="h-4 w-4" /> Concluir onboarding
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
