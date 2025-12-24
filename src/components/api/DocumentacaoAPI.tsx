import { Code, Book, Key, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { toast } from 'sonner';

const endpoints = [
  { method: 'GET', path: '/api/contas-receber', desc: 'Listar contas a receber' },
  { method: 'POST', path: '/api/contas-receber', desc: 'Criar conta a receber' },
  { method: 'GET', path: '/api/contas-pagar', desc: 'Listar contas a pagar' },
  { method: 'POST', path: '/api/contas-pagar', desc: 'Criar conta a pagar' },
  { method: 'GET', path: '/api/clientes', desc: 'Listar clientes' },
  { method: 'GET', path: '/api/fluxo-caixa', desc: 'Projeção de fluxo de caixa' },
];

const exemploRequest = `curl -X GET "https://api.promobrindes.com/api/contas-receber" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`;

const exemploResponse = `{
  "data": [
    {
      "id": "uuid",
      "cliente_nome": "Cliente Exemplo",
      "valor": 1500.00,
      "data_vencimento": "2024-02-15",
      "status": "pendente"
    }
  ],
  "meta": { "total": 42, "page": 1 }
}`;

export function DocumentacaoAPI() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success('Copiado!');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Book className="h-5 w-5" />
          Documentação da API
        </CardTitle>
        <CardDescription>API RESTful para integração com sistemas externos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 rounded-lg bg-muted/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span className="font-mono text-sm">API Key: ••••••••••••</span>
          </div>
          <Button variant="outline" size="sm">Gerar Nova Chave</Button>
        </div>

        <Tabs defaultValue="endpoints">
          <TabsList>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="exemplo">Exemplo</TabsTrigger>
          </TabsList>

          <TabsContent value="endpoints" className="space-y-2 mt-4">
            {endpoints.map((ep, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded border">
                <div className="flex items-center gap-3">
                  <Badge variant={ep.method === 'GET' ? 'secondary' : 'default'}>
                    {ep.method}
                  </Badge>
                  <code className="text-sm font-mono">{ep.path}</code>
                </div>
                <span className="text-sm text-muted-foreground">{ep.desc}</span>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="exemplo" className="space-y-4 mt-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Request</span>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(exemploRequest, 'req')}>
                  {copied === 'req' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <pre className="p-3 rounded bg-muted text-xs overflow-x-auto">{exemploRequest}</pre>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Response</span>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(exemploResponse, 'res')}>
                  {copied === 'res' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <pre className="p-3 rounded bg-muted text-xs overflow-x-auto">{exemploResponse}</pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
