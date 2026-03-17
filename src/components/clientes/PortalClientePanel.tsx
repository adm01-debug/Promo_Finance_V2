import { Key, Plus, Shield, Clock, Loader2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortalClienteTokens, useCreatePortalToken, useRevokePortalToken, usePortalClienteAcessos } from '@/hooks/usePortalCliente';
import { formatDate } from '@/lib/formatters';

interface Props {
  clienteId: string;
  clienteEmail: string;
}

export function PortalClientePanel({ clienteId, clienteEmail }: Props) {
  const { data: tokens, isLoading } = usePortalClienteTokens(clienteId);
  const { data: acessos } = usePortalClienteAcessos(clienteId);
  const createToken = useCreatePortalToken();
  const revokeToken = useRevokePortalToken();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToken = (token: string, id: string) => {
    navigator.clipboard.writeText(token);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) return <Card><CardContent className="p-6"><Skeleton className="h-24" /></CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Portal do Cliente</CardTitle>
              <CardDescription>Tokens de acesso ao portal self-service</CardDescription>
            </div>
          </div>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => createToken.mutate({ cliente_id: clienteId, email_cliente: clienteEmail })}
            disabled={createToken.isPending}
          >
            {createToken.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Gerar Token
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!tokens || tokens.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>Nenhum token gerado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tokens.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-0.5 rounded">{t.token.slice(0, 8)}...{t.token.slice(-4)}</code>
                    <Badge variant={t.ativo ? 'default' : 'secondary'}>{t.ativo ? 'Ativo' : 'Revogado'}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Criado: {formatDate(t.created_at)} • Expira: {formatDate(t.expires_at)}
                    {t.ultimo_acesso && ` • Último acesso: ${formatDate(t.ultimo_acesso)}`}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => copyToken(t.token, t.id)}>
                    {copiedId === t.id ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  {t.ativo && (
                    <Button size="sm" variant="destructive" onClick={() => revokeToken.mutate(t.id)} disabled={revokeToken.isPending}>
                      Revogar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Últimos acessos */}
        {acessos && acessos.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1"><Clock className="h-4 w-4" />Últimos Acessos</h4>
            <div className="space-y-1">
              {acessos.slice(0, 5).map((a) => (
                <div key={a.id} className="text-xs text-muted-foreground flex justify-between p-2 rounded bg-muted/30">
                  <span>{formatDate(a.created_at)}</span>
                  <span>{a.ip_address || 'IP desconhecido'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
