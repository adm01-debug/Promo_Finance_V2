import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { 
  Code2, 
  Key, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Copy, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  Zap,
  Book,
  AlertTriangle
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '@/hooks/useApiKeys';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const SCOPES = [
  { id: 'read', label: 'Leitura (Read)' },
  { id: 'write', label: 'Escrita (Write)' },
  { id: 'admin', label: 'Admin (Full Access)' },
  { id: 'finance', label: 'Financeiro (Financial Data)' },
  { id: 'tax', label: 'Tributário (Tax Data)' },
];

export default function ApiManagement() {
  const { currentEmpresaId } = useAuth();
  const { data: apiKeys = [], isLoading } = useApiKeys(currentEmpresaId || undefined);
  const createApiKey = useCreateApiKey();
  const revokeApiKey = useRevokeApiKey();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['read']);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!newKeyName || !currentEmpresaId) return;
    
    try {
      const result = await createApiKey.mutateAsync({
        name: newKeyName,
        empresa_id: currentEmpresaId,
        scopes: selectedScopes
      });
      setGeneratedKey(result.key);
    } catch (error) {
      console.error(error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Chave copiada para a área de transferência');
    setTimeout(() => setCopied(false), 2000);
  };

  const closeDialog = () => {
    setIsCreateDialogOpen(false);
    setGeneratedKey(null);
    setNewKeyName('');
    setSelectedScopes(['read']);
  };

  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        
        <div className="container mx-auto p-6 relative z-10 space-y-8">
          <PageHeader 
            title="API & Integrações" 
            subtitle="Gerencie chaves de acesso e configure webhooks para estender o Promo Finance."
            badge="Developer Hub"
            icon={Code2}
            gradientFrom="from-blue-600"
            gradientVia="via-primary"
            gradientTo="to-indigo-500"
          >
            <div className="flex items-center gap-3">
              <Button variant="outline" className="bg-white/5 border-white/10 text-white gap-2">
                <Book className="h-4 w-4" />
                Documentação API
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-primary hover:bg-primary/90 gap-2">
                <Plus className="h-4 w-4" />
                Nova Chave API
              </Button>
            </div>
          </PageHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">Suas Chaves de API</CardTitle>
                  <CardDescription>
                    Chaves ativas para integração com sistemas externos. Nunca compartilhe suas chaves secretas.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-white/40">Nome</TableHead>
                        <TableHead className="text-white/40">Prefixo</TableHead>
                        <TableHead className="text-white/40">Último Uso</TableHead>
                        <TableHead className="text-white/40">Criada em</TableHead>
                        <TableHead className="text-right text-white/40">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-white/40">Carregando...</TableCell></TableRow>
                      ) : apiKeys.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-12 text-white/20">Nenhuma chave de API gerada.</TableCell></TableRow>
                      ) : (
                        apiKeys.map((key) => (
                          <TableRow key={key.id} className="border-white/5 hover:bg-white/5 transition-colors">
                            <TableCell className="font-bold text-white">{key.name}</TableCell>
                            <TableCell><code className="bg-white/10 px-2 py-0.5 rounded text-xs text-primary">{key.key_prefix}...</code></TableCell>
                            <TableCell className="text-white/60 text-xs">
                              {key.last_used_at ? format(new Date(key.last_used_at), 'dd/MM/yy HH:mm') : 'Nunca usada'}
                            </TableCell>
                            <TableCell className="text-white/60 text-xs">
                              {format(new Date(key.created_at), 'dd/MM/yyyy')}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-white/20 hover:text-destructive"
                                onClick={() => revokeApiKey.mutate({ id: key.id, empresa_id: currentEmpresaId || '' })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">Configuração de Webhooks</CardTitle>
                  <CardDescription>
                    Receba notificações em tempo real no seu servidor quando eventos ocorrerem.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-12 text-white/20">
                  <Zap className="h-12 w-12 mb-4 opacity-10" />
                  <p className="mb-4">Nenhum webhook configurado.</p>
                  <Button variant="outline" className="border-white/10 text-white">Adicionar Endpoint</Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-primary/5 border-primary/20 backdrop-blur-xl border-dashed">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Segurança de API
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-white/60 space-y-4">
                  <p>
                    As chaves de API têm as mesmas permissões que um usuário administrador no Promo Finance.
                  </p>
                  <ul className="list-disc pl-4 space-y-2">
                    <li>Use chaves com escopos restritos sempre que possível.</li>
                    <li>Rode as chaves periodicamente por segurança.</li>
                    <li>Sempre utilize HTTPS para chamadas de API.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">Quick Start</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-black/40 rounded-lg border border-white/10">
                    <p className="text-[10px] text-primary font-black uppercase mb-2">Endpoint Base</p>
                    <code className="text-xs text-white/80">https://api.promofinance.com/v1</code>
                  </div>
                  <div className="p-3 bg-black/40 rounded-lg border border-white/10">
                    <p className="text-[10px] text-primary font-black uppercase mb-2">Autenticação</p>
                    <code className="text-xs text-white/80 break-all">Authorization: Bearer pf_live_...</code>
                  </div>
                  <Button variant="link" className="text-primary p-0 h-auto text-xs gap-1">
                    Ver exemplos de código <ExternalLink className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{generatedKey ? 'Chave de API Gerada' : 'Criar Nova Chave API'}</DialogTitle>
            <DialogDescription className="text-white/40">
              {generatedKey 
                ? 'Certifique-se de copiar sua chave agora. Você não poderá vê-la novamente por motivos de segurança.' 
                : 'Defina o nome e as permissões para a nova chave.'}
            </DialogDescription>
          </DialogHeader>

          {!generatedKey ? (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Nome da Chave</Label>
                <Input 
                  value={newKeyName} 
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Ex: Integração ERP"
                  className="bg-white/5 border-white/10"
                />
              </div>

              <div className="space-y-3">
                <Label>Escopos (Permissões)</Label>
                <div className="grid grid-cols-2 gap-3">
                  {SCOPES.map((scope) => (
                    <div key={scope.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={scope.id} 
                        checked={selectedScopes.includes(scope.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedScopes([...selectedScopes, scope.id]);
                          else setSelectedScopes(selectedScopes.filter(s => s !== scope.id));
                        }}
                      />

                      <label htmlFor={scope.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {scope.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl relative group">
                <code className="text-sm text-primary font-bold break-all pr-10">
                  {generatedKey}
                </code>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-2 top-2 h-8 w-8 hover:bg-primary/20"
                  onClick={() => copyToClipboard(generatedKey)}
                >
                  {copied ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-white/40 leading-relaxed italic">
                <AlertTriangle className="h-3 w-3 inline mr-1 text-warning" />
                Aviso: O Promo Finance não armazena sua chave privada. Se você perdê-la, terá que gerar uma nova chave e atualizar suas integrações.
              </p>
            </div>
          )}

          <DialogFooter>
            {generatedKey ? (
              <Button onClick={closeDialog} className="bg-primary w-full">Concluído</Button>
            ) : (
              <Button 
                onClick={handleCreate} 
                disabled={!newKeyName || createApiKey.isPending} 
                className="bg-primary hover:bg-primary/90 w-full"
              >
                {createApiKey.isPending ? 'Gerando...' : 'Gerar Chave Secret'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
