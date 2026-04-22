import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FlaskConical, CheckCircle2, XCircle, AlertCircle, Play, Code2, ChevronDown, ShieldCheck, UserPlus, UserCheck, Search, Filter, Target, ListChecks, History } from 'lucide-react';
import { useSSOProviders, useTestSSOLogin, type AppRole } from '@/hooks/useSSO';
import { useSaveSSOSandboxRun, type SandboxRun } from '@/hooks/useSSOSandboxRuns';
import { computeOutcome } from './sandbox/outcome';
import { SandboxHistory } from './sandbox/SandboxHistory';
import { IDP_PRESETS } from './IdpPresets';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

type FocusClaim = 'all' | 'email' | 'name' | 'groups' | 'domain';
type MappingFilter = 'all' | 'matched' | 'skipped' | 'no_match';

interface RoleMappingEval {
  idp_group: string;
  app_role: string;
  status: 'matched' | 'skipped' | 'no_match';
  ordem: number;
}

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
    claim_mapping_used?: { email: string; full_name: string; groups: string };
    claim_values?: { email_raw: unknown; full_name_raw: unknown; groups_raw: unknown };
    role_mappings_evaluated?: RoleMappingEval[];
    default_role?: string;
    default_role_used?: boolean;
  };
  errors: string[];
}

const FOCUS_CHIPS: Array<{ id: FocusClaim; label: string }> = [
  { id: 'all', label: 'Tudo' },
  { id: 'email', label: 'email' },
  { id: 'name', label: 'name' },
  { id: 'groups', label: 'groups' },
  { id: 'domain', label: 'domain' },
];

const FILTER_CHIPS: Array<{ id: MappingFilter; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'matched', label: 'Aplicadas' },
  { id: 'skipped', label: 'Ignoradas' },
  { id: 'no_match', label: 'Sem match' },
];

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

  const [focusClaim, setFocusClaim] = useState<FocusClaim>('all');
  const [mappingFilter, setMappingFilter] = useState<MappingFilter>('all');
  const [mappingSearch, setMappingSearch] = useState('');

  const jsonError = useMemo(() => {
    try { JSON.parse(claimsJson); return null; } catch (e) { return (e as Error).message; }
  }, [claimsJson]);

  const loadPreset = (presetId: string) => {
    const preset = MOCK_PRESETS[presetId];
    if (preset) setClaimsJson(JSON.stringify(preset, null, 2));
  };

  const saveRun = useSaveSSOSandboxRun();
  const [activeTab, setActiveTab] = useState<'simular' | 'historico'>('simular');

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
      const simResult = data as unknown as SimulationResult;
      setResult(simResult);
      if ((data as { success: boolean }).success) toast.success('Simulação concluída');
      else toast.error('Simulação encontrou problemas');

      // Persistir histórico (fire-and-forget)
      const provider = providers.find(p => p.id === providerId);
      saveRun.mutate({
        providerId: useProviderConfig && providerId ? providerId : null,
        providerNome: provider?.nome ?? simResult.preview.provider_nome ?? null,
        useProviderConfig,
        input: payload,
        result: simResult as never,
        outcome: computeOutcome(simResult as never),
      }, {
        onError: (e) => console.warn('[sandbox] falha ao salvar histórico:', e),
      });
    } catch (e) {
      toast.error('Erro ao simular', { description: e instanceof Error ? e.message : 'Erro' });
    }
  };

  const applyRun = (run: SandboxRun) => {
    const input = run.input as {
      mock_claims?: unknown;
      provider_id?: string;
      claim_mapping?: { email?: string; full_name?: string; groups?: string };
      default_role?: AppRole;
      allowed_domains?: string[];
      role_mappings?: Array<{ idp_group: string; app_role: string }>;
    };
    setProviderId(input.provider_id ?? '');
    setUseProviderConfig(!!input.provider_id);
    if (input.mock_claims !== undefined) {
      setClaimsJson(JSON.stringify(input.mock_claims, null, 2));
    }
    if (input.claim_mapping) {
      setManualEmail(input.claim_mapping.email ?? 'email');
      setManualName(input.claim_mapping.full_name ?? 'name');
      setManualGroups(input.claim_mapping.groups ?? 'groups');
    }
    if (input.default_role) setManualRole(input.default_role);
    if (input.allowed_domains) setManualDomains(input.allowed_domains.join(', '));
    if (input.role_mappings) {
      setManualMappings(input.role_mappings.map(m => `${m.idp_group}:${m.app_role}`).join('\n'));
    }
    setActiveTab('simular');
  };

  const filteredMappings = useMemo(() => {
    const list = result?.preview.role_mappings_evaluated ?? [];
    return list.filter(m => {
      if (mappingFilter !== 'all' && m.status !== mappingFilter) return false;
      if (mappingSearch && !m.idp_group.toLowerCase().includes(mappingSearch.toLowerCase())) return false;
      return true;
    });
  }, [result, mappingFilter, mappingSearch]);

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'simular' | 'historico')}>
      <TabsList className="mb-4">
        <TabsTrigger value="simular" className="gap-2"><FlaskConical className="h-4 w-4" />Simular</TabsTrigger>
        <TabsTrigger value="historico" className="gap-2"><History className="h-4 w-4" />Histórico</TabsTrigger>
      </TabsList>
      <TabsContent value="simular">
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
              <Label className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5" /> Claim em foco</Label>
              <span className="text-xs text-muted-foreground">Destaca a regra usada no painel ao lado</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {FOCUS_CHIPS.map(chip => (
                <Button
                  key={chip.id}
                  size="sm"
                  variant={focusClaim === chip.id ? 'default' : 'outline'}
                  className="h-7 text-xs"
                  onClick={() => setFocusClaim(chip.id)}
                >
                  {chip.label}
                </Button>
              ))}
            </div>
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
              <ClaimFocusCard result={result} focus={focusClaim} />

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
                  : `Papel padrão (fallback): ${result.preview.resolved_role}`}
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

              <RulesAppliedCard
                result={result}
                filter={mappingFilter}
                setFilter={setMappingFilter}
                search={mappingSearch}
                setSearch={setMappingSearch}
                filtered={filteredMappings}
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

function formatRaw(v: unknown): string {
  if (v === null || v === undefined) return '(não encontrada)';
  if (Array.isArray(v)) return JSON.stringify(v);
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function ClaimFocusCard({ result, focus }: { result: SimulationResult; focus: FocusClaim }) {
  const cm = result.preview.claim_mapping_used ?? { email: 'email', full_name: 'name', groups: 'groups' };
  const cv = result.preview.claim_values ?? { email_raw: null, full_name_raw: null, groups_raw: null };
  const matchedGroup = result.preview.matched_group;
  const evaluated = result.preview.role_mappings_evaluated ?? [];
  const groupsThatMatchSomeRule = new Set(
    evaluated.filter(e => e.status === 'matched' || e.status === 'skipped').map(e => e.idp_group)
  );

  type Row = { key: FocusClaim; label: string; jwtKey: string; raw: unknown; normalized: string };
  const rows: Row[] = [
    { key: 'email', label: 'email', jwtKey: cm.email, raw: cv.email_raw, normalized: result.preview.email ?? '(vazio)' },
    { key: 'name', label: 'name', jwtKey: cm.full_name, raw: cv.full_name_raw, normalized: result.preview.full_name || '(vazio)' },
    { key: 'groups', label: 'groups', jwtKey: cm.groups, raw: cv.groups_raw, normalized: result.preview.groups.length ? result.preview.groups.join(', ') : '(nenhum)' },
    { key: 'domain', label: 'domain', jwtKey: '(derivado de email)', raw: result.preview.domain || null, normalized: result.preview.domain || '(vazio)' },
  ];

  const visible = focus === 'all' ? rows : rows.filter(r => r.key === focus);

  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium">
          Claim em foco: <span className="text-primary">{focus === 'all' ? 'Todos' : focus}</span>
        </p>
      </div>
      <div className="space-y-2">
        {visible.map(row => (
          <div key={row.key} className="rounded-md border bg-background p-2 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono font-semibold">{row.label}</span>
              <Badge variant="outline" className="text-[10px]">JWT: {row.jwtKey}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground">bruto:</span>{' '}
                <span className="font-mono break-all">{formatRaw(row.raw)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">normalizado:</span>{' '}
                <span className="font-mono break-all">{row.normalized}</span>
              </div>
            </div>
            {row.key === 'groups' && result.preview.groups.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {result.preview.groups.map(g => {
                  const isMatched = g === matchedGroup;
                  const couldMatch = groupsThatMatchSomeRule.has(g);
                  return (
                    <Badge
                      key={g}
                      variant="outline"
                      className={cn(
                        'text-[10px]',
                        isMatched && 'border-success/60 text-success bg-success/10',
                        !isMatched && couldMatch && 'border-secondary/60 text-secondary',
                      )}
                    >
                      {g}
                      {isMatched && ' ✓'}
                      {!isMatched && couldMatch && ' ○'}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RulesAppliedCard({
  result,
  filter,
  setFilter,
  search,
  setSearch,
  filtered,
}: {
  result: SimulationResult;
  filter: MappingFilter;
  setFilter: (f: MappingFilter) => void;
  search: string;
  setSearch: (s: string) => void;
  filtered: RoleMappingEval[];
}) {
  const cm = result.preview.claim_mapping_used;
  const cv = result.preview.claim_values;
  const evaluated = result.preview.role_mappings_evaluated ?? [];
  const defaultRoleUsed = result.preview.default_role_used;
  const defaultRole = result.preview.default_role ?? result.preview.resolved_role;

  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-center gap-2">
        <ListChecks className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium">Regras aplicadas</p>
      </div>

      {cm && cv && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground">Claim mapping</p>
          <div className="rounded-md border overflow-hidden text-xs">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2 font-medium">Campo</th>
                  <th className="text-left p-2 font-medium">Claim no JWT</th>
                  <th className="text-left p-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {([
                  { field: 'email', jwtKey: cm.email, raw: cv.email_raw },
                  { field: 'full_name', jwtKey: cm.full_name, raw: cv.full_name_raw },
                  { field: 'groups', jwtKey: cm.groups, raw: cv.groups_raw },
                ] as const).map(r => {
                  const has = r.raw !== null && r.raw !== undefined && r.raw !== '';
                  return (
                    <tr key={r.field} className="border-t">
                      <td className="p-2 font-mono">{r.field}</td>
                      <td className="p-2 font-mono">{r.jwtKey}</td>
                      <td className="p-2">
                        {has ? (
                          <Badge variant="outline" className="text-[10px] border-success/40 text-success">aplicado</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">vazio</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-muted-foreground">Role mappings ({evaluated.length})</p>
          {defaultRoleUsed && (
            <Badge variant="outline" className="text-[10px] border-warning/40 text-warning">
              fallback default_role: {defaultRole}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Filter className="h-3 w-3 text-muted-foreground" />
            {FILTER_CHIPS.map(c => (
              <Button
                key={c.id}
                size="sm"
                variant={filter === c.id ? 'default' : 'outline'}
                className="h-6 px-2 text-[11px]"
                onClick={() => setFilter(c.id)}
              >
                {c.label}
              </Button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[140px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar grupo IdP..."
              className="h-7 pl-7 text-xs"
            />
          </div>
        </div>

        {evaluated.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Nenhum role mapping configurado.</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Nenhuma regra para os filtros atuais.</p>
        ) : (
          <ul className="space-y-1">
            {filtered.map(m => (
              <li
                key={`${m.ordem}-${m.idp_group}`}
                className={cn(
                  'flex items-center justify-between rounded-md border px-2 py-1.5 text-xs',
                  m.status === 'matched' && 'border-success/40 bg-success/5',
                  m.status === 'skipped' && 'bg-muted/30',
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-mono text-muted-foreground">#{m.ordem + 1}</span>
                  <span className="font-mono truncate">{m.idp_group}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-mono">{m.app_role}</span>
                </div>
                <RuleStatusBadge status={m.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function RuleStatusBadge({ status }: { status: RoleMappingEval['status'] }) {
  if (status === 'matched') {
    return <Badge variant="outline" className="text-[10px] border-success/40 text-success gap-1"><CheckCircle2 className="h-3 w-3" />aplicada</Badge>;
  }
  if (status === 'skipped') {
    return <Badge variant="outline" className="text-[10px] text-muted-foreground gap-1">○ ignorada</Badge>;
  }
  return <Badge variant="outline" className="text-[10px] text-muted-foreground gap-1"><XCircle className="h-3 w-3" />sem match</Badge>;
}
