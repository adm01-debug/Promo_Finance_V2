import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Copy, Trash2, ShieldCheck, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEmpresas } from '@/hooks/useFinancialData';
import { useScimTokens, useCreateScimToken, useRevokeScimToken, type ScimDefaultRole } from '@/hooks/useScimTokens';
import { ScimSetupGuide } from './ScimSetupGuide';
import { toast } from 'sonner';

const SCIM_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scim-server/scim/v2`;

export function ScimTokensTab() {
  const { data: empresas = [] } = useEmpresas();
  const [empresaId, setEmpresaId] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [issued, setIssued] = useState<string | null>(null);

  const { data: tokens = [] } = useScimTokens(empresaId);
  const create = useCreateScimToken();
  const revoke = useRevokeScimToken();

  const handleCreate = async () => {
    if (!empresaId || !nome) return;
    const r = await create.mutateAsync({ empresa_id: empresaId, nome });
    setIssued(r.token);
    setNome('');
  };

  const copy = (text: string, label = 'Copiado') => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  return (
    <Tabs defaultValue="tokens" className="space-y-6">
      <TabsList>
        <TabsTrigger value="tokens">Tokens</TabsTrigger>
        <TabsTrigger value="guide">Como configurar</TabsTrigger>
      </TabsList>

      <TabsContent value="tokens" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Endpoint SCIM 2.0</CardTitle>
          <CardDescription>Configure no seu IdP (Azure AD, Okta) para sincronização automática de usuários</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">SCIM Base URL</Label>
            <div className="flex gap-2 mt-1">
              <Input readOnly value={SCIM_BASE} className="font-mono text-xs" />
              <Button size="icon" variant="outline" onClick={() => copy(SCIM_BASE, 'URL copiada')}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Alert>
            <AlertDescription className="text-xs">
              Endpoints disponíveis: <code>/Users</code>, <code>/Groups</code>, <code>/ServiceProviderConfig</code>.
              Autenticação via <code>Authorization: Bearer &lt;token&gt;</code>.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tokens SCIM</CardTitle>
            <CardDescription>Gere um token por IdP. Cada token é escopado a uma empresa.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger className="w-[240px]">
                <Building2 className="h-4 w-4 mr-2" /><SelectValue placeholder="Selecione a empresa" />
              </SelectTrigger>
              <SelectContent>
                {empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => setOpen(true)} disabled={!empresaId}>
              <Plus className="h-4 w-4 mr-1" />Novo token
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!empresaId ? (
            <p className="text-sm text-muted-foreground">Selecione uma empresa para listar seus tokens.</p>
          ) : tokens.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum token SCIM ativo para esta empresa.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Prefixo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último uso</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.nome}</TableCell>
                    <TableCell className="font-mono text-xs">{t.token_prefix}…</TableCell>
                    <TableCell>
                      {t.ativo
                        ? <Badge className="bg-success text-success-foreground">ativo</Badge>
                        : <Badge variant="secondary">revogado</Badge>}
                    </TableCell>
                    <TableCell className="text-xs">{t.last_used_at ? format(new Date(t.last_used_at), 'dd/MM HH:mm') : '—'}</TableCell>
                    <TableCell className="text-xs">{format(new Date(t.created_at), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="text-right">
                      {t.ativo && (
                        <Button size="sm" variant="ghost" onClick={() => revoke.mutate(t.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setIssued(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{issued ? 'Token gerado' : 'Novo token SCIM'}</DialogTitle></DialogHeader>
          {issued ? (
            <div className="space-y-3">
              <Alert variant="warning">
                <AlertTitle>Copie agora!</AlertTitle>
                <AlertDescription>Por segurança, este token não será exibido novamente.</AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Input readOnly value={issued} className="font-mono text-xs" />
                <Button size="icon" onClick={() => copy(issued, 'Token copiado')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button className="w-full" onClick={() => { setOpen(false); setIssued(null); }}>Concluir</Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label>Nome do token *</Label>
                <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Azure AD - Produção" />
              </div>
              <Button className="w-full" disabled={!nome || create.isPending} onClick={handleCreate}>
                Gerar token
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </TabsContent>

      <TabsContent value="guide">
        <ScimSetupGuide />
      </TabsContent>
    </Tabs>
  );
}
