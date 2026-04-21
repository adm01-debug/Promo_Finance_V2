import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FlaskConical, CheckCircle2, XCircle, AlertCircle, Play, Code2, ChevronDown, ShieldCheck, UserPlus, UserCheck } from 'lucide-react';
import { useSSOProviders, useTestSSOLogin, type AppRole } from '@/hooks/useSSO';
import { IDP_PRESETS } from './IdpPresets';
import { toast } from 'sonner';

const MOCK_PRESETS: Record<string, Record<string, unknown>> = {
  azure: {
    preferred_username: 'joao.silva@empresa.com.br',
    email: 'joao.silva@empresa.com.br',
    name: 'João Silva',
    oid: '00000000-0000-0000-0000-000000000001',
    groups: ['Admins-Financeiro', 'Todos-Funcionarios'],
    tid: '00000000-0000-0000-0000-aaaaaaaaaaaa',
  },
  okta: {
    email: 'maria.souza@empresa.com.br',
    name: 'Maria Souza',
    groups: ['Operacional', 'Todos'],
    sub: 'okta|abc123',
  },
  google: {
    email: 'carlos@empresa.com.br',
    name: 'Carlos Pereira',
    hd: 'empresa.com.br',
    picture: 'https://lh3.googleusercontent.com/a/xyz',
    email_verified: true,
  },
  custom: {
    email: 'usuario@empresa.com.br',
    name: 'Usuário Teste',
    groups: ['grupo-padrao'],
  },
};

interface SimulationResult {
  success: boolean;
  preview: {
    email: string | null;
    full_name: string;
    groups: string[];
    domain: string;
    domain_allowed: boolean;
    resolved_role: string;
    matched_group: string | null;
    user_exists: boolean;
    would_jit_provision: boolean;
    provision_blocked_reason: string | null;
    provider_nome: string | null;
    auto_provision_users: boolean;
  };
  errors: string[];
}

export function SSOSandboxPanel() {
  const { data: providers = [] } = useSSOProviders();
  const testMutation = useTestSSOLogin();

  const [providerId, setProviderId] = useState<string>('');
  const [useProviderConfig, setUseProviderConfig] = useState(true);
  const [claimsJson, setClaimsJson] = useState<string>(JSON.stringify(MOCK_PRESETS.azure, null, 2));
  const [manualEmail, setManualEmail] = useState('email');
  const [manualName, setManualName] = useState('name');
  const [manualGroups, setManualGroups] = useState('groups');
  const [manualRole, setManualRole] = useState<AppRole>('visualizador');
  const [manualDomains, setManualDomains] = useState('');
  const [manualMappings, setManualMappings] = useState('Admins-Financeiro:financeiro\nOperacional:operacional');
  const [result, setResult] = useState<SimulationResult | null>(null);

  const jsonError = useMemo(() => {
    try { JSON.parse(claimsJson); return null; } catch (e) { return (e as Error).message; }
  }, [claimsJson]);

  const loadPreset = (presetId: string) => {
    const preset = MOCK_PRESETS[presetId];
    if (preset) setClaimsJson(JSON.stringify(preset, null, 2));
  };

  const simulate = async () => {
    if (jsonError) { toast.error('JSON inválido', { description: jsonError }); return; }
    const mock_claims = JSON.parse(claimsJson);
    try {
      const payload: Record<string, unknown> = { mock_claims };
      if (useProviderConfig && providerId) {
        payload.provider_id = providerId;
      } else {
        payload.claim_mapping = { email: manualEmail, full_name: manualName, groups: manualGroups };
        payload.default_role = manualRole;
        payload.allowed_domains = manualDomains.split(',').map(d => d.trim()).filter(Boolean);
        payload.role_mappings = manualMappings.split('\n').map(line => {
          const [g, r] = line.split(':').map(s => s.trim());
          return g && r ? { idp_group: g, app_role: r } : null;
        }).filter(Boolean);
      }
      const data = await testMutation.mutateAsync(payload);
      setResult(data as unknown as SimulationResult);
      if ((data as { success: boolean }).success) toast.success('Simulação concluída');
      else toast.error('Simulação encontrou problemas');
    } catch (e) {
      toast.error('Erro ao simular', { description: e instanceof Error ? e.message : 'Erro' });
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            Sandbox de simulação SSO
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Simule um login SSO end-to-end com claims customizadas. Nenhum usuário é criado e nenhuma sessão é emitida.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Provedor SSO</Label>
            <Select value={providerId} onValueChange={setProviderId}>
              <SelectTrigger><SelectValue placeholder="Selecione um provedor" /></SelectTrigger>
              <SelectContent>
                {providers.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome} <Badge variant="outline" className="ml-2">{p.tipo.toUpperCase()}</Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="cursor-pointer">Usar configuração do provider</Label>
              <p className="text-xs text-muted-foreground">
                Quando ativo, ignora os campos manuais abaixo e usa a config real do provider selecionado.
              </p>
            </div>
            <Switch checked={useProviderConfig} onCheckedChange={setUseProviderConfig} disabled={!providerId} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Claims simuladas (JSON)</Label>
              <div className="flex items-center gap-1">
                {IDP_PRESETS.filter(p => MOCK_PRESETS[p.id]).map(p => (
                  <Button key={p.id} size="sm" variant="ghost" className="h-7 text-xs" onClick={() => loadPreset(p.id)}>
                    {p.logo} {p.id}
                  </Button>
                ))}
              </div>
            </div>
            <Textarea
              value={claimsJson}
              onChange={(e) => setClaimsJson(e.target.value)}
              rows={12}
              className="font-mono text-xs"
              spellCheck={false}
            />
            {jsonError ? (
              <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />JSON inválido</Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-success border-success/40"><CheckCircle2 className="h-3 w-3" />JSON válido</Badge>
            )}
          </div>

          {(!useProviderConfig || !providerId) && (
            <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground">Configuração manual</p>
              <div className="grid grid-cols-3 gap-2">
                <div><Label className="text-xs">Claim email</Label><input className="w-full h-9 rounded-md border bg-background px-2 text-sm" value={manualEmail} onChange={e => setManualEmail(e.target.value)} /></div>
                <div><Label className="text-xs">Claim nome</Label><input className="w-full h-9 rounded-md border bg-background px-2 text-sm" value={manualName} onChange={e => setManualName(e.target.value)} /></div>
                <div><Label className="text-xs">Claim grupos</Label><input className="w-full h-9 rounded-md border bg-background px-2 text-sm" value={manualGroups} onChange={e => setManualGroups(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Papel padrão</Label>
                  <Select value={manualRole} onValueChange={(v) => setManualRole(v as AppRole)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">admin</SelectItem>
                      <SelectItem value="financeiro">financeiro</SelectItem>
                      <SelectItem value="operacional">operacional</SelectItem>
                      <SelectItem value="visualizador">visualizador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Domínios permitidos (vírgula)</Label><input className="w-full h-9 rounded-md border bg-background px-2 text-sm" value={manualDomains} onChange={e => setManualDomains(e.target.value)} placeholder="empresa.com.br" /></div>
              </div>
              <div>
                <Label className="text-xs">Mapeamentos grupo:role (1 por linha)</Label>
                <Textarea rows={3} className="font-mono text-xs" value={manualMappings} onChange={e => setManualMappings(e.target.value)} />
              </div>
            </div>
          )}

          <Button onClick={simulate} disabled={!!jsonError || testMutation.isPending} className="w-full gap-2">
            <Play className="h-4 w-4" />
            {testMutation.isPending ? 'Simulando...' : 'Simular login'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Resultado da simulação
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!result ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FlaskConical className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">Configure as claims e clique em "Simular login"</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <Step
                ok={!!result.preview.email}
                title="Parsing de claims"
                detail={result.preview.email
                  ? `email=${result.preview.email} · nome=${result.preview.full_name || '(vazio)'} · grupos=${result.preview.groups.length ? result.preview.groups.join(', ') : '(nenhum)'}`
                  : 'Email não encontrado nas claims'}
              />
              <Step
                ok={result.preview.domain_allowed}
                title="Validação de domínio"
                detail={result.preview.domain
                  ? `${result.preview.domain} · ${result.preview.domain_allowed ? 'permitido' : 'bloqueado pela allowlist'}`
                  : 'Domínio não detectado'}
              />
              <Step
                ok
                title="Resolução de papel"
                detail={result.preview.matched_group
                  ? `Grupo "${result.preview.matched_group}" → ${result.preview.resolved_role}`
                  : `Papel padrão: ${result.preview.resolved_role}`}
                icon={<UserCheck className="h-4 w-4" />}
              />
              <Step
                ok={result.preview.user_exists || result.preview.would_jit_provision}
                title="Provisionamento"
                detail={
                  result.preview.user_exists
                    ? 'Usuário já existe — login seria efetuado'
                    : result.preview.would_jit_provision
                      ? 'Usuário seria criado via JIT provisioning'
                      : `Bloqueado: ${result.preview.provision_blocked_reason ?? 'desconhecido'}`
                }
                icon={result.preview.user_exists ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              />

              {result.errors.length > 0 && (
                <Alert variant="error">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc pl-4 space-y-1">
                      {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 w-full justify-start">
                    <Code2 className="h-4 w-4" /> Ver resposta JSON <ChevronDown className="h-3 w-3 ml-auto" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <pre className="text-xs font-mono bg-muted p-3 rounded-md overflow-auto max-h-72">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </CollapsibleContent>
              </Collapsible>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Step({ ok, title, detail, icon }: { ok: boolean; title: string; detail: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <div className={ok ? 'text-success' : 'text-destructive'}>
        {icon ?? (ok ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground break-words">{detail}</p>
      </div>
    </div>
  );
}
