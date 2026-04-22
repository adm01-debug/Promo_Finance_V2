import { useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs as InnerTabs, TabsContent as InnerTabsContent, TabsList as InnerTabsList, TabsTrigger as InnerTabsTrigger } from '@/components/ui/tabs';
import { Layers, Play, Square, Upload, Sparkles, Download, AlertCircle, FileText, FileSpreadsheet } from 'lucide-react';
import { useSSOProviders, type AppRole, type SSOProvider } from '@/hooks/useSSO';
import { runBulk, BULK_MAX_USERS, type BulkResult, type BulkUserInput } from '@/lib/sso/sandbox-bulk-runner';
import { aggregateBulk } from '@/lib/sso/sandbox-bulk-aggregator';
import {
  parseBulkCsv,
  parseBulkJson,
  exportBulkResultsCsv,
  downloadCsv,
  BULK_EXAMPLE_USERS,
} from '@/lib/sso/sandbox-csv';
import { useSaveSSOSandboxRun } from '@/hooks/useSSOSandboxRuns';
import { computeOutcome } from './outcome';
import { SandboxBulkSummary } from './SandboxBulkSummary';
import { SandboxBulkTable } from './SandboxBulkTable';
import { toast } from 'sonner';

interface Props {
  onOpenInSimulator: (claims: Record<string, unknown>, base: BasePayload) => void;
}

interface BasePayload {
  provider_id?: string;
  claim_mapping?: { email?: string; full_name?: string; groups?: string };
  default_role?: string;
  allowed_domains?: string[];
  role_mappings?: Array<{ idp_group: string; app_role: string }>;
}

export function SandboxBulkPanel({ onOpenInSimulator }: Props) {
  const { data: providers = [] } = useSSOProviders();
  const saveRun = useSaveSSOSandboxRun();

  const [inputMode, setInputMode] = useState<'json' | 'csv'>('json');
  const [text, setText] = useState<string>(JSON.stringify(BULK_EXAMPLE_USERS, null, 2));
  const fileRef = useRef<HTMLInputElement>(null);

  const [providerId, setProviderId] = useState<string>('');
  const [useProviderConfig, setUseProviderConfig] = useState(true);
  const [manualEmail, setManualEmail] = useState('email');
  const [manualName, setManualName] = useState('name');
  const [manualGroups, setManualGroups] = useState('groups');
  const [manualRole, setManualRole] = useState<AppRole>('visualizador');
  const [manualDomains, setManualDomains] = useState('empresa.com.br');
  const [manualMappings, setManualMappings] = useState('Admins-Financeiro:financeiro\nOperacional:operacional\nAdmins-TI:admin');

  const [persistHistory, setPersistHistory] = useState(false);

  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<BulkResult[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const parsed = useMemo(() => {
    if (inputMode === 'json') return parseBulkJson(text);
    return parseBulkCsv(text);
  }, [text, inputMode]);

  const aggregate = useMemo(() => aggregateBulk(results), [results]);

  const buildBase = (): BasePayload => {
    if (useProviderConfig && providerId) return { provider_id: providerId };
    return {
      claim_mapping: { email: manualEmail, full_name: manualName, groups: manualGroups },
      default_role: manualRole,
      allowed_domains: manualDomains.split(',').map(d => d.trim()).filter(Boolean),
      role_mappings: manualMappings
        .split('\n')
        .map(line => {
          const [g, r] = line.split(':').map(s => s.trim());
          return g && r ? { idp_group: g, app_role: r } : null;
        })
        .filter((x): x is { idp_group: string; app_role: string } => x !== null),
    };
  };

  const findProvider = (): SSOProvider | undefined => providers.find(p => p.id === providerId);

  const loadExample = () => {
    setInputMode('json');
    setText(JSON.stringify(BULK_EXAMPLE_USERS, null, 2));
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setText(String(reader.result ?? ''));
      setInputMode('csv');
    };
    reader.readAsText(f, 'utf-8');
    e.target.value = '';
  };

  const execute = async () => {
    if (parsed.errors.length > 0) {
      toast.error('Corrija os erros de parsing antes de executar');
      return;
    }
    if (parsed.users.length === 0) {
      toast.error('Nenhum usuário para simular');
      return;
    }
    if (parsed.users.length > BULK_MAX_USERS) {
      toast.error(`Máximo ${BULK_MAX_USERS} usuários por lote`);
      return;
    }

    const base = buildBase();
    const batchId = crypto.randomUUID();
    const provider = findProvider();

    setRunning(true);
    setResults([]);
    setProgress({ done: 0, total: parsed.users.length });
    abortRef.current = new AbortController();

    try {
      const users: BulkUserInput[] = parsed.users;
      const finalResults: BulkResult[] = [];
      await runBulk(users, base, {
        concurrency: 5,
        signal: abortRef.current.signal,
        onProgress: (done, total) => setProgress({ done, total }),
        onResult: (r) => {
          finalResults.push(r);
          setResults(prev => [...prev, r]);
          if (persistHistory && r.result) {
            saveRun.mutate({
              providerId: useProviderConfig && providerId ? providerId : null,
              providerNome: provider?.nome ?? r.result.preview.provider_nome ?? null,
              useProviderConfig,
              input: { ...base, mock_claims: r.claims, batch_id: batchId },
              result: r.result as never,
              outcome: computeOutcome(r.result as never),
            } as never, {
              onError: (e) => console.warn('[bulk] persist failed:', e),
            });
          }
        },
      });
      const aborted = abortRef.current.signal.aborted;
      if (aborted) toast.warning('Lote cancelado');
      else toast.success(`Lote concluído: ${finalResults.length} usuários processados`);
    } catch (e) {
      toast.error('Erro ao executar lote', { description: e instanceof Error ? e.message : 'Erro' });
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
  };

  const exportCsv = () => {
    if (results.length === 0) return;
    const csv = exportBulkResultsCsv(results);
    const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 13);
    downloadCsv(`lote-sandbox-${ts}.csv`, csv);
  };

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Entrada do lote
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Até {BULK_MAX_USERS} usuários por execução. Cada item vira uma chamada à edge sso-test-login.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <InnerTabs value={inputMode} onValueChange={(v) => setInputMode(v as 'json' | 'csv')}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <InnerTabsList>
                  <InnerTabsTrigger value="json" className="gap-1.5"><FileText className="h-3.5 w-3.5" />JSON</InnerTabsTrigger>
                  <InnerTabsTrigger value="csv" className="gap-1.5"><FileSpreadsheet className="h-3.5 w-3.5" />CSV</InnerTabsTrigger>
                </InnerTabsList>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={loadExample}>
                    <Sparkles className="h-3 w-3" />Exemplo
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => fileRef.current?.click()}>
                    <Upload className="h-3 w-3" />CSV
                  </Button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={onFileChange}
                  />
                </div>
              </div>
              <InnerTabsContent value="json" className="mt-3">
                <Textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  rows={14}
                  className="font-mono text-xs"
                  placeholder='[{"email":"a@empresa.com","groups":["Admins"]}]'
                />
              </InnerTabsContent>
              <InnerTabsContent value="csv" className="mt-3">
                <Textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  rows={14}
                  className="font-mono text-xs"
                  placeholder="email,name,groups&#10;a@empresa.com,Ana,Admins|Todos"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  1ª linha = cabeçalho. Coluna <code>groups</code> separada por <code>|</code>.
                </p>
              </InnerTabsContent>
            </InnerTabs>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <Badge variant="outline" className="gap-1">
                <span className="font-mono">{parsed.users.length}</span> usuários
              </Badge>
              {parsed.errors.length > 0 && (
                <Badge variant="outline" className="gap-1 border-destructive/40 text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {parsed.errors.length} erro(s) de parsing
                </Badge>
              )}
              {parsed.users.length > BULK_MAX_USERS && (
                <Badge variant="outline" className="border-warning/40 text-warning">
                  Acima do máximo ({BULK_MAX_USERS})
                </Badge>
              )}
            </div>

            {parsed.errors.length > 0 && (
              <Alert variant="error">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc pl-4 space-y-0.5 text-xs max-h-24 overflow-auto">
                    {parsed.errors.slice(0, 8).map((e, i) => (
                      <li key={i}>linha {e.line}: {e.message}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              Configuração & execução
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">Provedor SSO</Label>
              <Select value={providerId} onValueChange={setProviderId}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Selecione um provedor" /></SelectTrigger>
                <SelectContent>
                  {providers.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome} <Badge variant="outline" className="ml-2">{p.tipo.toUpperCase()}</Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-2.5">
              <div>
                <Label className="cursor-pointer text-sm">Usar configuração do provider</Label>
                <p className="text-[11px] text-muted-foreground">Ignora os campos manuais abaixo.</p>
              </div>
              <Switch checked={useProviderConfig} onCheckedChange={setUseProviderConfig} disabled={!providerId} />
            </div>

            {(!useProviderConfig || !providerId) && (
              <div className="space-y-2 rounded-lg border p-2.5 bg-muted/30">
                <p className="text-[11px] font-semibold text-muted-foreground">Configuração manual</p>
                <div className="grid grid-cols-3 gap-2">
                  <div><Label className="text-[10px]">Claim email</Label><Input className="h-8 text-xs" value={manualEmail} onChange={e => setManualEmail(e.target.value)} /></div>
                  <div><Label className="text-[10px]">Claim nome</Label><Input className="h-8 text-xs" value={manualName} onChange={e => setManualName(e.target.value)} /></div>
                  <div><Label className="text-[10px]">Claim grupos</Label><Input className="h-8 text-xs" value={manualGroups} onChange={e => setManualGroups(e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px]">Papel padrão</Label>
                    <Select value={manualRole} onValueChange={(v) => setManualRole(v as AppRole)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">admin</SelectItem>
                        <SelectItem value="financeiro">financeiro</SelectItem>
                        <SelectItem value="operacional">operacional</SelectItem>
                        <SelectItem value="visualizador">visualizador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-[10px]">Domínios permitidos</Label><Input className="h-8 text-xs" value={manualDomains} onChange={e => setManualDomains(e.target.value)} /></div>
                </div>
                <div>
                  <Label className="text-[10px]">Mapeamentos grupo:role</Label>
                  <Textarea rows={3} className="font-mono text-[11px]" value={manualMappings} onChange={e => setManualMappings(e.target.value)} />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border p-2.5">
              <div>
                <Label className="cursor-pointer text-sm">Salvar runs no histórico</Label>
                <p className="text-[11px] text-muted-foreground">
                  Persiste cada usuário do lote em <code>sso_sandbox_runs</code> com o mesmo <code>batch_id</code>.
                </p>
              </div>
              <Switch checked={persistHistory} onCheckedChange={setPersistHistory} />
            </div>

            {running && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span>Progresso</span>
                  <span className="font-mono text-muted-foreground">{progress.done}/{progress.total}</span>
                </div>
                <Progress value={progress.total ? (progress.done / progress.total) * 100 : 0} className="h-2" />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={execute}
                disabled={running || parsed.users.length === 0 || parsed.errors.length > 0}
                className="flex-1 gap-2"
              >
                <Play className="h-4 w-4" />
                {running ? 'Executando...' : `Executar lote (${parsed.users.length})`}
              </Button>
              {running && (
                <Button variant="outline" onClick={cancel} className="gap-2">
                  <Square className="h-4 w-4" />Cancelar
                </Button>
              )}
              {results.length > 0 && !running && (
                <Button variant="outline" onClick={exportCsv} className="gap-2">
                  <Download className="h-4 w-4" />CSV
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {results.length > 0 && (
        <>
          <SandboxBulkSummary aggregate={aggregate} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resultado por usuário</CardTitle>
            </CardHeader>
            <CardContent>
              <SandboxBulkTable
                results={results}
                onOpenInSimulator={(r) => onOpenInSimulator(r.claims, buildBase())}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
