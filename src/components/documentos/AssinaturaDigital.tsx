import { useState } from 'react';
import { PenTool, FileSignature, CheckCircle, Clock, Send, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Signatario {
  nome: string;
  email: string;
  status: 'pendente' | 'assinado' | 'recusado';
}

interface AssinaturaDigitalProps {
  documentoId?: string;
  documentoNome?: string;
  onAssinaturaConcluida?: (signatarios: Signatario[]) => void;
}

export function AssinaturaDigital({ documentoId, documentoNome = 'Documento', onAssinaturaConcluida }: AssinaturaDigitalProps) {
  const [signatarios, setSignatarios] = useState<Signatario[]>([]);
  const [novoNome, setNovoNome] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [enviando, setEnviando] = useState(false);

  const adicionarSignatario = () => {
    if (!novoNome || !novoEmail) {
      toast.error('Preencha nome e email');
      return;
    }
    setSignatarios(prev => [...prev, { nome: novoNome, email: novoEmail, status: 'pendente' }]);
    setNovoNome('');
    setNovoEmail('');
  };

  const removerSignatario = (email: string) => {
    setSignatarios(prev => prev.filter(s => s.email !== email));
  };

  const enviarParaAssinatura = async () => {
    if (signatarios.length === 0) {
      toast.error('Adicione pelo menos um signatário');
      return;
    }
    setEnviando(true);
    // Simulação de envio
    await new Promise(r => setTimeout(r, 1500));
    toast.success('Documento enviado para assinatura!');
    setEnviando(false);
    onAssinaturaConcluida?.(signatarios);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSignature className="h-5 w-5" />
          Assinatura Digital
        </CardTitle>
        <CardDescription>Envie documentos para assinatura eletrônica</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-sm font-medium">{documentoNome}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Input placeholder="Nome" value={novoNome} onChange={e => setNovoNome(e.target.value)} />
          <Input placeholder="Email" type="email" value={novoEmail} onChange={e => setNovoEmail(e.target.value)} />
          <Button onClick={adicionarSignatario} variant="outline">Adicionar</Button>
        </div>

        {signatarios.length > 0 && (
          <div className="space-y-2">
            {signatarios.map((sig, idx) => (
              <motion.div key={sig.email} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center justify-between p-2 rounded border">
                <div>
                  <p className="text-sm font-medium">{sig.nome}</p>
                  <p className="text-xs text-muted-foreground">{sig.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={sig.status === 'assinado' ? 'default' : 'secondary'}>
                    {sig.status === 'pendente' && <Clock className="h-3 w-3 mr-1" />}
                    {sig.status === 'assinado' && <CheckCircle className="h-3 w-3 mr-1" />}
                    {sig.status}
                  </Badge>
                  <Button size="icon" variant="ghost" onClick={() => removerSignatario(sig.email)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <Button onClick={enviarParaAssinatura} disabled={enviando || signatarios.length === 0} className="w-full">
          <Send className="h-4 w-4 mr-2" />
          {enviando ? 'Enviando...' : 'Enviar para Assinatura'}
        </Button>
      </CardContent>
    </Card>
  );
}
