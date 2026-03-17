import { useState } from 'react';
import { MessageSquare, Settings, CheckCircle2, AlertTriangle, ExternalLink, Send, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function WhatsAppConfigPanel() {
  const [phoneId, setPhoneId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [testNumber, setTestNumber] = useState('');
  const [testing, setTesting] = useState(false);
  const [configured, setConfigured] = useState(false);

  const handleTestSend = async () => {
    if (!testNumber) {
      toast.error('Informe um número para teste');
      return;
    }
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-ia-proativo', {
        body: {
          action: 'test',
          telefone: testNumber,
          mensagem: '✅ Teste de integração WhatsApp Business - Promo Finance'
        }
      });
      if (error) throw error;
      toast.success('Mensagem de teste enviada!');
      setConfigured(true);
    } catch (err: any) {
      toast.error(err.message || 'Falha no envio. Verifique as configurações.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-green-500" />
          WhatsApp Business API
        </CardTitle>
        <CardDescription>Configure a integração com WhatsApp para cobranças automáticas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          {configured ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span className="text-sm font-medium text-success">Integração configurada e funcionando</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-5 w-5 text-warning" />
              <span className="text-sm font-medium text-warning">Configuração pendente</span>
            </>
          )}
        </div>

        {/* Pré-requisitos */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Pré-requisitos</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Conta Meta Business verificada</li>
            <li>Número de telefone verificado no WhatsApp Business</li>
            <li>Templates de mensagem aprovados pela Meta</li>
            <li>Token de acesso permanente configurado</li>
          </ul>
        </div>

        <Separator />

        {/* Configuração */}
        <div className="space-y-3">
          <div>
            <Label>Phone Number ID (Meta)</Label>
            <Input value={phoneId} onChange={e => setPhoneId(e.target.value)} placeholder="Ex: 123456789012345" />
          </div>
          <div>
            <Label>Access Token</Label>
            <Input type="password" value={accessToken} onChange={e => setAccessToken(e.target.value)} placeholder="Token permanente do Meta Business" />
          </div>
        </div>

        <Separator />

        {/* Teste */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Testar Envio</h4>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input value={testNumber} onChange={e => setTestNumber(e.target.value)} placeholder="5511999999999" />
            </div>
            <Button onClick={handleTestSend} disabled={testing} className="gap-2">
              <Send className="h-4 w-4" />
              {testing ? 'Enviando...' : 'Enviar Teste'}
            </Button>
          </div>
        </div>

        {/* Dica */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-xs text-muted-foreground">
            <strong>Nota:</strong> As secrets WHATSAPP_PHONE_ID e WHATSAPP_ACCESS_TOKEN devem ser configuradas
            nas variáveis de ambiente do backend para que o envio funcione em produção.
          </p>
        </div>

        <Button variant="outline" className="gap-2" asChild>
          <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" /> Documentação Meta WhatsApp API
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
