import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Info } from 'lucide-react';
import { IDP_PRESETS } from './IdpPresets';

export function SSODocumentacao() {
  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Esta tela gerencia configuração e governança de SSO (claim mapping, role mapping, domain restriction, auditoria).
          Para finalizar o handshake SAML server-side, abra um chamado no suporte Lovable Cloud anexando a metadata XML gerada.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        {IDP_PRESETS.filter(p => p.id !== 'custom').map(p => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="text-2xl">{p.logo}</span>
                {p.nome}
                <Badge variant="outline" className="ml-auto uppercase text-xs">{p.tipo}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground mb-3">
                {p.instrucoes.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
              {p.docs_url && (
                <a href={p.docs_url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-primary text-sm hover:underline">
                  Documentação oficial <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
