import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FlaskConical,
  AlertCircle,
  Code2,
  ChevronDown,
  ShieldCheck,
  UserPlus,
  UserCheck,
  History,
  Layers,
} from 'lucide-react';
import { useSSOProviders, useTestSSOLogin, type AppRole } from '@/hooks/useSSO';
import { useSaveSSOSandboxRun, type SandboxRun } from '@/hooks/useSSOSandboxRuns';
import { computeOutcome } from './sandbox/outcome';
import { SandboxHistory } from './sandbox/SandboxHistory';
import { SandboxBulkPanel } from './sandbox/SandboxBulkPanel';
import { toast } from 'sonner';
import {
  MOCK_PRESETS,
  type FocusClaim,
  type MappingFilter,
  type SimulationResult,
} from './sandbox/types';
import { Step } from './sandbox/Step';
import { ClaimFocusCard } from './sandbox/ClaimFocusCard';
import { RulesAppliedCard } from './sandbox/RulesAppliedCard';
import { SSOSandboxPanelSandboxSimulacaoSSO } from './SSOSandboxPanelSandboxSimulacaoSSO';

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
  const [manualMappings, setManualMappings] = useState(
    'Admins-Financeiro:financeiro\nOperacional:operacional'
  );
  const [result, setResult] = useState<SimulationResult | null>(null);

  const [focusClaim, setFocusClaim] = useState<FocusClaim>('all');
  const [mappingFilter, setMappingFilter] = useState<MappingFilter>('all');
  const [mappingSearch, setMappingSearch] = useState('');

  const jsonError = useMemo(() => {
    try {
      JSON.parse(claimsJson);
      return null;
    } catch (e) {
      return (e as Error).message;
    }
  }, [claimsJson]);

  const loadPreset = (presetId: string) => {
    const preset = MOCK_PRESETS[presetId];
    if (preset) setClaimsJson(JSON.stringify(preset, null, 2));
  };

  const saveRun = useSaveSSOSandboxRun();
  const [activeTab, setActiveTab] = useState<'simular' | 'lote' | 'historico'>('simular');

  const applyClaimsFromBulk = (
    claims: Record<string, unknown>,
    base: {
      provider_id?: string;
      claim_mapping?: { email?: string; full_name?: string; groups?: string };
      default_role?: string;
      allowed_domains?: string[];
      role_mappings?: Array<{ idp_group: string; app_role: string }>;
    }
  ) => {
    setClaimsJson(JSON.stringify(claims, null, 2));
    if (base.provider_id) {
      setProviderId(base.provider_id);
      setUseProviderConfig(true);
    } else {
      setUseProviderConfig(false);
      if (base.claim_mapping) {
        setManualEmail(base.claim_mapping.email ?? 'email');
        setManualName(base.claim_mapping.full_name ?? 'name');
        setManualGroups(base.claim_mapping.groups ?? 'groups');
      }
      if (base.default_role) setManualRole(base.default_role as AppRole);
      if (base.allowed_domains) setManualDomains(base.allowed_domains.join(', '));
      if (base.role_mappings) {
        setManualMappings(base.role_mappings.map((m) => `${m.idp_group}:${m.app_role}`).join('\n'));
      }
    }
    setActiveTab('simular');
    toast.success('Claims carregadas no Simular');
  };

  const simulate = async () => {
    if (jsonError) {
      toast.error('JSON inválido', { description: jsonError });
      return;
    }
    const mock_claims = JSON.parse(claimsJson);
    try {
      const payload: Record<string, unknown> = { mock_claims };
      if (useProviderConfig && providerId) {
        payload.provider_id = providerId;
      } else {
        payload.claim_mapping = { email: manualEmail, full_name: manualName, groups: manualGroups };
        payload.default_role = manualRole;
        payload.allowed_domains = manualDomains
          .split(',')
          .map((d) => d.trim())
          .filter(Boolean);
        payload.role_mappings = manualMappings
          .split('\n')
          .map((line) => {
            const [g, r] = line.split(':').map((s) => s.trim());
            return g && r ? { idp_group: g, app_role: r } : null;
          })
          .filter(Boolean);
      }
      const data = await testMutation.mutateAsync(payload);
      const simResult = data as unknown as SimulationResult;
      setResult(simResult);
      if ((data as { success: boolean }).success) toast.success('Simulação concluída');
      else toast.error('Simulação encontrou problemas');

      const provider = providers.find((p) => p.id === providerId);
      saveRun.mutate(
        {
          providerId: useProviderConfig && providerId ? providerId : null,
          providerNome: provider?.nome ?? simResult.preview.provider_nome ?? null,
          useProviderConfig,
          input: payload,
          result: simResult as never,
          outcome: computeOutcome(simResult as never),
        },
        {
          onError: (e) => console.warn('[sandbox] falha ao salvar histórico:', e),
        }
      );
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
      setManualMappings(input.role_mappings.map((m) => `${m.idp_group}:${m.app_role}`).join('\n'));
    }
    setActiveTab('simular');
  };

  const filteredMappings = useMemo(() => {
    const list = result?.preview.role_mappings_evaluated ?? [];
    return list.filter((m) => {
      if (mappingFilter !== 'all' && m.status !== mappingFilter) return false;
      if (mappingSearch && !m.idp_group.toLowerCase().includes(mappingSearch.toLowerCase()))
        return false;
      return true;
    });
  }, [result, mappingFilter, mappingSearch]);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as 'simular' | 'lote' | 'historico')}
    >
      <TabsList className="mb-4">
        <TabsTrigger value="simular" className="gap-2">
          <FlaskConical className="h-4 w-4" />
          Simular
        </TabsTrigger>
        <TabsTrigger value="lote" className="gap-2">
          <Layers className="h-4 w-4" />
          Lote
        </TabsTrigger>
        <TabsTrigger value="historico" className="gap-2">
          <History className="h-4 w-4" />
          Histórico
        </TabsTrigger>
      </TabsList>
      <TabsContent value="simular">
        <div className="grid lg:grid-cols-2 gap-6">
          <SSOSandboxPanelSandboxSimulacaoSSO
            providerId={providerId}
            setProviderId={setProviderId}
            providers={providers}
            useProviderConfig={useProviderConfig}
            setUseProviderConfig={setUseProviderConfig}
            focusClaim={focusClaim}
            setFocusClaim={setFocusClaim}
            loadPreset={loadPreset}
            claimsJson={claimsJson}
            setClaimsJson={setClaimsJson}
            jsonError={jsonError}
            manualEmail={manualEmail}
            setManualEmail={setManualEmail}
            manualName={manualName}
            setManualName={setManualName}
            manualGroups={manualGroups}
            setManualGroups={setManualGroups}
            manualRole={manualRole}
            setManualRole={setManualRole}
            manualDomains={manualDomains}
            setManualDomains={setManualDomains}
            manualMappings={manualMappings}
            setManualMappings={setManualMappings}
            simulate={simulate}
            testMutation={testMutation}
          />

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
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <ClaimFocusCard result={result} focus={focusClaim} />

                  <Step
                    ok={!!result.preview.email}
                    title="Parsing de claims"
                    detail={
                      result.preview.email
                        ? `email=${result.preview.email} · nome=${result.preview.full_name || '(vazio)'} · grupos=${result.preview.groups.length ? result.preview.groups.join(', ') : '(nenhum)'}`
                        : 'Email não encontrado nas claims'
                    }
                  />
                  <Step
                    ok={result.preview.domain_allowed}
                    title="Validação de domínio"
                    detail={
                      result.preview.domain
                        ? `${result.preview.domain} · ${result.preview.domain_allowed ? 'permitido' : 'bloqueado pela allowlist'}`
                        : 'Domínio não detectado'
                    }
                  />
                  <Step
                    ok
                    title="Resolução de papel"
                    detail={
                      result.preview.matched_group
                        ? `Grupo "${result.preview.matched_group}" → ${result.preview.resolved_role}`
                        : `Papel padrão (fallback): ${result.preview.resolved_role}`
                    }
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
                    icon={
                      result.preview.user_exists ? (
                        <UserCheck className="h-4 w-4" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )
                    }
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
                          {result.errors.map((e, i) => (
                            <li key={i}>{e}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2 w-full justify-start">
                        <Code2 className="h-4 w-4" /> Ver resposta JSON{' '}
                        <ChevronDown className="h-3 w-3 ml-auto" />
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
      </TabsContent>
      <TabsContent value="lote">
        <SandboxBulkPanel onOpenInSimulator={applyClaimsFromBulk} />
      </TabsContent>
      <TabsContent value="historico">
        <SandboxHistory onReplay={applyRun} />
      </TabsContent>
    </Tabs>
  );
}
