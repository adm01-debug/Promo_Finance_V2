import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy, ExternalLink, Info, Loader2, CheckCircle2, XCircle, PlugZap, History, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';

const SCIM_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scim-server/scim/v2`;

const ATTR_MAPPINGS = [
  { scim: 'userName', source: 'user.userPrincipalName / user.email', required: true },
  { scim: 'name.formatted', source: 'user.displayName', required: false },
  { scim: 'emails[type eq "work"].value', source: 'user.mail', required: false },
  { scim: 'externalId', source: 'objectId / user.id', required: true },
  { scim: 'active', source: 'Not([Suspended]) ou user.accountEnabled', required: true },
];

function CopyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="flex gap-2 mt-1">
        <Input readOnly value={value} className="font-mono text-xs" />
        <Button
          size="icon"
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(value);
            toast.success('Copiado');
          }}
          aria-label={`Copiar ${label}`}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

type TestResult =
  | { ok: true; status: number; latencyMs: number }
  | { ok: false; status?: number; latencyMs?: number; message: string; hint?: string };

type TestHistoryEntry = {
  timestamp: number;
  ok: boolean;
  status?: number;
  latencyMs?: number;
  message?: string;
};

const SCIM_SP_CONFIG_SCHEMA = 'urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig';
const HISTORY_STORAGE_KEY = 'scim:test-history';
const HISTORY_MAX = 5;

function loadHistory(): TestHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, HISTORY_MAX) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: TestHistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries.slice(0, HISTORY_MAX)));
  } catch {
    /* ignore quota */
  }
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.round(diff / 1000);
  if (sec < 60) return `há ${sec}s`;
  const min = Math.round(sec / 60);
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return `há ${d} d`;
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export function ScimSetupGuide() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [history, setHistory] = useState<TestHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const pushHistory = useCallback((entry: TestHistoryEntry) => {
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, HISTORY_MAX);
      saveHistory(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
    toast.success('Histórico limpo');
  }, []);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);
    const url = `${SCIM_BASE}/ServiceProviderConfig`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const start = performance.now();
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/scim+json' },
        signal: controller.signal,
      });
      const latencyMs = Math.round(performance.now() - start);
      if (!res.ok) {
        setResult({
          ok: false,
          status: res.status,
          latencyMs,
          message: `Endpoint respondeu HTTP ${res.status} ${res.statusText}`,
          hint: res.status >= 500 ? 'Servidor SCIM com falha — verifique logs da edge function scim-server.' : undefined,
        });
        return;
      }
      const json = await res.json().catch(() => null);
      const schemas: string[] = Array.isArray(json?.schemas) ? json.schemas : [];
      if (!schemas.includes(SCIM_SP_CONFIG_SCHEMA)) {
        setResult({
          ok: false,
          status: res.status,
          latencyMs,
          message: 'Resposta 200 mas o payload não é um ServiceProviderConfig SCIM 2.0 válido.',
          hint: 'Verifique se a URL aponta para /scim/v2/ServiceProviderConfig.',
        });
        return;
      }
      setResult({ ok: true, status: res.status, latencyMs });
    } catch (err) {
      const latencyMs = Math.round(performance.now() - start);
      const isAbort = (err as Error)?.name === 'AbortError';
      setResult({
        ok: false,
        latencyMs,
        message: isAbort ? 'Timeout: o endpoint não respondeu em 8s.' : `Falha ao conectar: ${(err as Error).message}`,
        hint: isAbort
          ? 'Tente novamente ou verifique a saúde da edge function scim-server.'
          : 'Se o erro for de CORS/rede, lembre que IdPs (Azure AD, Okta) chamam o endpoint a partir de servidores externos — esse teste local pode falhar mesmo com endpoint saudável em produção.',
      });
    } finally {
      clearTimeout(timeout);
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Use este guia para conectar Azure AD ou Okta ao endpoint SCIM. Antes de começar,
          gere um <strong>token SCIM</strong> na aba "Tokens" e copie-o (será exibido apenas uma vez).
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Endpoint do servidor SCIM</CardTitle>
          <CardDescription>Cole estes valores no painel de provisionamento do seu IdP.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <CopyField label="Tenant URL / SCIM 2.0 Base URL" value={SCIM_BASE} />
          <CopyField label="Authorization header" value="Bearer <SEU_TOKEN_SCIM>" />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Badge variant="outline" className="justify-center py-2">SCIM 2.0</Badge>
            <Badge variant="outline" className="justify-center py-2">Bearer auth</Badge>
          </div>

          <div className="pt-2 space-y-3 border-t">
            <div className="flex items-center justify-between gap-3 pt-3">
              <div>
                <p className="text-sm font-medium">Testar conexão</p>
                <p className="text-xs text-muted-foreground">
                  Faz um <code>GET /ServiceProviderConfig</code> sem token para validar se o endpoint está online.
                </p>
              </div>
              <Button onClick={handleTest} disabled={testing} variant="outline">
                {testing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Testando…</>
                ) : (
                  <><PlugZap className="h-4 w-4 mr-2" />Testar conexão</>
                )}
              </Button>
            </div>

            {result?.ok && (
              <Alert variant="success" title="Endpoint SCIM acessível">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>HTTP {result.status} • {result.latencyMs} ms • schema SCIM 2.0 válido</span>
                  </div>
                  <div className="text-xs space-y-1 pt-1">
                    <p className="font-medium">Status esperado por IdP:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                      <li><strong>Azure AD:</strong> "Test Connection" deve retornar <code>200 OK</code>.</li>
                      <li><strong>Okta:</strong> "Test Connector Configuration" deve ficar todo verde.</li>
                    </ul>
                    <p className="text-muted-foreground pt-1">
                      Lembre-se que ações autenticadas (criação de usuários) ainda exigem um token SCIM válido.
                    </p>
                  </div>
                </div>
              </Alert>
            )}

            {result && result.ok === false && (
              <Alert variant="error" title="Não foi possível validar o endpoint">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    <XCircle className="h-3.5 w-3.5" />
                    <span>
                      {result.message}
                      {result.latencyMs !== undefined && ` • ${result.latencyMs} ms`}
                    </span>
                  </div>
                  {result.hint && <p className="text-xs text-muted-foreground">{result.hint}</p>}
                </div>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="azure">
        <TabsList>
          <TabsTrigger value="azure">Azure AD / Entra ID</TabsTrigger>
          <TabsTrigger value="okta">Okta</TabsTrigger>
          <TabsTrigger value="attrs">Mapeamento de atributos</TabsTrigger>
        </TabsList>

        <TabsContent value="azure" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Provisionamento via Azure AD</CardTitle>
              <CardDescription>Use a galeria como custom non-gallery app.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Portal Azure → <strong>Enterprise applications</strong> → <strong>New application</strong> → <strong>Create your own application</strong>.</li>
                <li>Em <strong>Provisioning</strong>, escolha modo <strong>Automatic</strong>.</li>
                <li>Cole a <strong>Tenant URL</strong> e o <strong>Secret Token</strong> gerados acima.</li>
                <li>Clique <strong>Test Connection</strong> — deve retornar 200 OK.</li>
                <li>Em <strong>Mappings</strong>, mantenha apenas <strong>Provision Azure AD Users</strong> (Groups opcional).</li>
                <li>Ajuste atributos conforme a aba "Mapeamento de atributos".</li>
                <li>Em <strong>Settings → Scope</strong>, selecione "Sync only assigned users and groups".</li>
                <li>Atribua usuários ou grupos em <strong>Users and groups</strong> e ative o provisionamento.</li>
              </ol>
              <Alert>
                <AlertDescription className="text-xs">
                  Azure AD faz polling a cada ~40 minutos. Use "Provision on demand" para testar mudanças individuais.
                </AlertDescription>
              </Alert>
              <a
                href="https://learn.microsoft.com/azure/active-directory/app-provisioning/use-scim-to-provision-users-and-groups"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
              >
                Documentação Azure AD SCIM <ExternalLink className="h-3 w-3" />
              </a>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="okta" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Provisionamento via Okta</CardTitle>
              <CardDescription>Ative SCIM no painel "Provisioning" da app.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Console Okta → <strong>Applications</strong> → <strong>Create App Integration</strong> (SAML 2.0 ou OIDC).</li>
                <li>Após salvar, abra <strong>General → App Settings</strong> e marque <strong>Enable SCIM provisioning</strong>.</li>
                <li>Em <strong>Provisioning → Integration</strong>, configure:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li><strong>SCIM connector base URL</strong>: cole a Tenant URL acima</li>
                    <li><strong>Unique identifier field for users</strong>: <code>userName</code></li>
                    <li><strong>Supported provisioning actions</strong>: Push New Users, Push Profile Updates, Push Groups</li>
                    <li><strong>Authentication mode</strong>: <code>HTTP Header</code> com <code>Authorization: Bearer &lt;token&gt;</code></li>
                  </ul>
                </li>
                <li>Clique <strong>Test Connector Configuration</strong> — todas as ações devem ficar verdes.</li>
                <li>Em <strong>To App</strong>, ative: Create Users, Update User Attributes, Deactivate Users.</li>
                <li>Em <strong>Assignments</strong>, adicione usuários ou grupos para iniciar o sync.</li>
              </ol>
              <a
                href="https://developer.okta.com/docs/concepts/scim/"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
              >
                Documentação Okta SCIM <ExternalLink className="h-3 w-3" />
              </a>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attrs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mapeamento de atributos SCIM</CardTitle>
              <CardDescription>Atributos suportados pelo nosso endpoint <code>/Users</code>.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Atributo SCIM</TableHead>
                    <TableHead>Origem (Azure AD / Okta)</TableHead>
                    <TableHead className="text-center">Obrigatório</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ATTR_MAPPINGS.map((m) => (
                    <TableRow key={m.scim}>
                      <TableCell className="font-mono text-xs">{m.scim}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.source}</TableCell>
                      <TableCell className="text-center">
                        {m.required ? <Badge>sim</Badge> : <Badge variant="secondary">opcional</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Alert className="mt-4">
                <AlertDescription className="text-xs">
                  Usuários novos recebem o papel <code>visualizador</code> por padrão. Para mapear grupos do
                  IdP a papéis (admin, financeiro, etc.), configure <strong>SSO Role Mappings</strong> no
                  provedor SSO correspondente.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
