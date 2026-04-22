import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Check, ChevronLeft, ChevronRight, Copy, Download, ExternalLink, Plus, Trash2, X } from 'lucide-react';
import { IDP_PRESETS, type IdpPreset } from './IdpPresets';
import { useSaveSSOProvider, useTestSSOConfig, useGenerateSSOMetadata, useSaveSSORoleMappings, useSSORoleMappings, type SSOProvider, type AppRole } from '@/hooks/useSSO';
import { useSSOConsistency } from '@/hooks/useSSOConsistency';
import { SSOConsistencyPanel } from './SSOConsistencyPanel';
import type { AutoFix } from '@/lib/sso/consistency';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: SSOProvider | null;
}

const ROLES: AppRole[] = ['admin', 'financeiro', 'operacional', 'visualizador'];
const STEPS = ['Tipo', 'Conexão', 'Mapeamento', 'Validação'];

export function SSOWizardDialog({ open, onOpenChange, editing }: Props) {
  const [step, setStep] = useState(0);
  const [preset, setPreset] = useState<IdpPreset | null>(null);
  const [form, setForm] = useState<Partial<SSOProvider>>({
    tipo: 'oidc',
    ativo: false,
    allowed_domains: [],
    default_role: 'visualizador',
    auto_provision_users: true,
    force_sso_for_domains: false,
    scopes: ['openid', 'profile', 'email'],
    claim_mapping: { email: 'email', full_name: 'name', groups: 'groups' },
  });
  const [domainInput, setDomainInput] = useState('');
  const [roleMappings, setRoleMappings] = useState<Array<{ idp_group: string; app_role: AppRole }>>([]);
  const [metadata, setMetadata] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);

  const save = useSaveSSOProvider();
  const test = useTestSSOConfig();
  const genMeta = useGenerateSSOMetadata();
  const saveMappings = useSaveSSORoleMappings();
  const { data: existingMappings } = useSSORoleMappings(editing?.id);

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm(editing);
        setPreset(IDP_PRESETS.find(p => p.id === editing.preset) ?? null);
        setStep(1);
      } else {
        setForm({
          tipo: 'oidc', ativo: false, allowed_domains: [],
          default_role: 'visualizador', auto_provision_users: true, force_sso_for_domains: false,
          scopes: ['openid', 'profile', 'email'],
          claim_mapping: { email: 'email', full_name: 'name', groups: 'groups' },
        });
        setPreset(null);
        setStep(0);
        setRoleMappings([]);
        setMetadata(null);
        setTestResult(null);
      }
    }
  }, [open, editing]);

  useEffect(() => {
    if (existingMappings?.length) {
      setRoleMappings(existingMappings.map(m => ({ idp_group: m.idp_group, app_role: m.app_role })));
    }
  }, [existingMappings]);

  const selectPreset = (p: IdpPreset) => {
    setPreset(p);
    setForm(prev => ({
      ...prev,
      tipo: p.tipo,
      preset: p.id,
      nome: prev.nome || p.nome,
      scopes: p.scopes ?? prev.scopes,
      claim_mapping: p.claim_mapping ?? prev.claim_mapping,
    }));
  };

  const addDomain = () => {
    const d = domainInput.trim().toLowerCase().replace(/^@/, '');
    if (d && !form.allowed_domains?.includes(d)) {
      setForm(p => ({ ...p, allowed_domains: [...(p.allowed_domains ?? []), d] }));
      setDomainInput('');
    }
  };

  const handleTest = async () => {
    setTestResult(null);
    const r = await test.mutateAsync({
      tipo: form.tipo,
      discovery_url: form.discovery_url,
      metadata_xml: form.metadata_xml,
      sso_url: form.sso_url,
      x509_cert: form.x509_cert,
    });
    setTestResult(r);
    if (r.valid && r.discovered) {
      setForm(p => ({ ...p, ...r.discovered }));
    }
  };

  const handleGenerateMetadata = async () => {
    const r = await genMeta.mutateAsync({ tipo: form.tipo!, nome: form.nome });
    setMetadata(r);
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  };

  const handleSave = async () => {
    const saved = await save.mutateAsync(form as any);
    if (saved?.id) {
      await saveMappings.mutateAsync({ providerId: saved.id, mappings: roleMappings });
    }
    onOpenChange(false);
  };

  const consistency = useSSOConsistency({
    preset: form.preset ?? null,
    claim_mapping: form.claim_mapping ?? null,
    allowed_domains: form.allowed_domains ?? [],
    role_mappings: roleMappings,
    default_role: form.default_role ?? null,
    auto_provision_users: form.auto_provision_users ?? null,
    force_sso_for_domains: form.force_sso_for_domains ?? null,
  });

  const applyAutofix = (patch: AutoFix['patch']) => {
    if (patch.allowed_domains !== undefined) {
      setForm((p) => ({ ...p, allowed_domains: patch.allowed_domains as string[] }));
    }
    if (patch.claim_mapping !== undefined) {
      setForm((p) => ({ ...p, claim_mapping: { ...p.claim_mapping, ...patch.claim_mapping } as SSOProvider['claim_mapping'] }));
    }
    if (patch.default_role !== undefined) {
      setForm((p) => ({ ...p, default_role: patch.default_role as AppRole }));
    }
    if (patch.role_mappings !== undefined) {
      setRoleMappings(patch.role_mappings as Array<{ idp_group: string; app_role: AppRole }>);
    }
    toast.success('Correção aplicada');
  };

  const next = () => setStep(s => Math.min(s + 1, 3));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar provedor SSO' : 'Novo provedor SSO'}</DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center justify-between py-4">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center flex-1">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium transition-colors",
                i < step && "bg-success border-success text-success-foreground",
                i === step && "border-primary bg-primary text-primary-foreground",
                i > step && "border-border text-muted-foreground"
              )}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn("ml-2 text-sm hidden sm:inline", i === step && "font-medium")}>{label}</span>
              {i < STEPS.length - 1 && <div className={cn("flex-1 h-0.5 mx-3", i < step ? "bg-success" : "bg-border")} />}
            </div>
          ))}
        </div>

        {/* Step 0: Tipo */}
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Selecione seu provedor de identidade:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {IDP_PRESETS.map(p => (
                <Card
                  key={p.id}
                  onClick={() => selectPreset(p)}
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary hover:shadow-md",
                    preset?.id === p.id && "border-primary ring-2 ring-primary/20"
                  )}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl mb-2">{p.logo}</div>
                    <div className="font-medium text-sm">{p.nome}</div>
                    <Badge variant="outline" className="mt-2 text-xs uppercase">{p.tipo}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Conexão */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Nome do provedor *</Label>
              <Input value={form.nome ?? ''} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Azure AD - Empresa XYZ" />
            </div>

            {preset?.instrucoes && (
              <Alert>
                <AlertDescription>
                  <p className="font-medium mb-2">Como obter as credenciais no {preset.nome}:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    {preset.instrucoes.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                  {preset.docs_url && (
                    <a href={preset.docs_url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-primary text-sm mt-2 hover:underline">
                      Documentação <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {form.tipo === 'oidc' ? (
              <>
                <div>
                  <Label>Discovery URL (.well-known/openid-configuration) *</Label>
                  <Input
                    value={form.discovery_url ?? ''}
                    onChange={e => setForm(p => ({ ...p, discovery_url: e.target.value }))}
                    placeholder={preset?.discovery_url_template ?? 'https://...'}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Client ID *</Label>
                    <Input value={form.client_id ?? ''} onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Nome do secret (Client Secret) *</Label>
                    <Input
                      value={form.client_secret_ref ?? ''}
                      onChange={e => setForm(p => ({ ...p, client_secret_ref: e.target.value }))}
                      placeholder="SSO_AZURE_SECRET"
                    />
                  </div>
                </div>
                <Alert>
                  <AlertDescription className="text-xs">
                    Adicione o Client Secret como segredo no Lovable Cloud com o nome informado acima.
                    O valor nunca é armazenado em texto puro.
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <>
                <div>
                  <Label>Metadata XML do IdP</Label>
                  <Textarea
                    rows={6}
                    value={form.metadata_xml ?? ''}
                    onChange={e => setForm(p => ({ ...p, metadata_xml: e.target.value }))}
                    placeholder="Cole o conteúdo do metadata.xml do seu IdP"
                    className="font-mono text-xs"
                  />
                </div>
                <div className="text-center text-sm text-muted-foreground">— ou configure manualmente —</div>
                <div>
                  <Label>SSO URL (SingleSignOnService Location)</Label>
                  <Input value={form.sso_url ?? ''} onChange={e => setForm(p => ({ ...p, sso_url: e.target.value }))} />
                </div>
                <div>
                  <Label>Certificado X.509</Label>
                  <Textarea
                    rows={4}
                    value={form.x509_cert ?? ''}
                    onChange={e => setForm(p => ({ ...p, x509_cert: e.target.value }))}
                    className="font-mono text-xs"
                  />
                </div>
              </>
            )}
            <div>
              <Label>URL de logout (SLO) <span className="text-xs text-muted-foreground font-normal">— opcional</span></Label>
              <Input
                value={form.slo_url ?? ''}
                onChange={e => setForm(p => ({ ...p, slo_url: e.target.value }))}
                placeholder={form.tipo === 'oidc' ? 'https://login.idp.com/oauth2/v2.0/logout' : 'https://idp.com/saml/slo'}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Para OIDC, deixe em branco para usar o <code>end_session_endpoint</code> do discovery. Sem URL de logout, o "Sair" encerra apenas a sessão local.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Mapeamento */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <Label>Domínios de e-mail permitidos</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={domainInput}
                  onChange={e => setDomainInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDomain())}
                  placeholder="empresa.com.br"
                />
                <Button type="button" onClick={addDomain}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {form.allowed_domains?.map(d => (
                  <Badge key={d} variant="secondary" className="gap-1">
                    @{d}
                    <button onClick={() => setForm(p => ({ ...p, allowed_domains: p.allowed_domains?.filter(x => x !== d) }))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Claim de e-mail</Label>
                <Input value={form.claim_mapping?.email ?? ''} onChange={e => setForm(p => ({ ...p, claim_mapping: { ...p.claim_mapping!, email: e.target.value } }))} />
              </div>
              <div>
                <Label className="text-xs">Claim de nome</Label>
                <Input value={form.claim_mapping?.full_name ?? ''} onChange={e => setForm(p => ({ ...p, claim_mapping: { ...p.claim_mapping!, full_name: e.target.value } }))} />
              </div>
              <div>
                <Label className="text-xs">Claim de grupos</Label>
                <Input value={form.claim_mapping?.groups ?? ''} onChange={e => setForm(p => ({ ...p, claim_mapping: { ...p.claim_mapping!, groups: e.target.value } }))} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Mapeamento grupo → papel</Label>
                <Button size="sm" variant="outline" onClick={() => setRoleMappings(m => [...m, { idp_group: '', app_role: 'visualizador' }])}>
                  <Plus className="h-3 w-3 mr-1" />Adicionar
                </Button>
              </div>
              <div className="space-y-2">
                {roleMappings.map((m, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      placeholder="Grupo no IdP (ex: Finance-Admins)"
                      value={m.idp_group}
                      onChange={e => setRoleMappings(arr => arr.map((x, j) => j === i ? { ...x, idp_group: e.target.value } : x))}
                    />
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Select value={m.app_role} onValueChange={(v: AppRole) => setRoleMappings(arr => arr.map((x, j) => j === i ? { ...x, app_role: v } : x))}>
                      <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="icon" variant="ghost" onClick={() => setRoleMappings(arr => arr.filter((_, j) => j !== i))}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                {!roleMappings.length && <p className="text-xs text-muted-foreground">Nenhum mapeamento. Usuários receberão o papel padrão.</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Papel padrão (sem grupo correspondente)</Label>
                <Select value={form.default_role} onValueChange={(v: AppRole) => setForm(p => ({ ...p, default_role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-provisionar usuários</Label>
                  <p className="text-xs text-muted-foreground">Cria conta automaticamente no primeiro login</p>
                </div>
                <Switch checked={!!form.auto_provision_users} onCheckedChange={v => setForm(p => ({ ...p, auto_provision_users: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Forçar SSO para os domínios permitidos</Label>
                  <p className="text-xs text-muted-foreground">Bloqueia login com senha para esses domínios</p>
                </div>
                <Switch checked={!!form.force_sso_for_domains} onCheckedChange={v => setForm(p => ({ ...p, force_sso_for_domains: v }))} />
              </div>
            </div>

            <SSOConsistencyPanel
              issues={consistency.issues}
              errors={consistency.errors}
              warnings={consistency.warnings}
              infos={consistency.infos}
              onAutofix={applyAutofix}
            />
          </div>
        )}

        {/* Step 3: Validação */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={handleTest} disabled={test.isPending}>
                {test.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Testar configuração
              </Button>
              <Button variant="outline" onClick={handleGenerateMetadata} disabled={genMeta.isPending}>
                Gerar metadata SP
              </Button>
            </div>

            {testResult && (
              <Alert variant={testResult.valid ? 'success' : 'error'}>
                <AlertDescription className="flex items-center gap-2">
                  {testResult.valid ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4" />}
                  {testResult.message}
                </AlertDescription>
              </Alert>
            )}

            {metadata && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  {metadata.callback_url && (
                    <div>
                      <Label className="text-xs">Callback / Redirect URI (cole no IdP)</Label>
                      <div className="flex gap-2 mt-1">
                        <Input readOnly value={metadata.callback_url} className="font-mono text-xs" />
                        <Button size="icon" variant="outline" onClick={() => copy(metadata.callback_url, 'Callback URL')}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {metadata.acs_url && (
                    <div>
                      <Label className="text-xs">ACS URL (Assertion Consumer Service)</Label>
                      <div className="flex gap-2 mt-1">
                        <Input readOnly value={metadata.acs_url} className="font-mono text-xs" />
                        <Button size="icon" variant="outline" onClick={() => copy(metadata.acs_url, 'ACS URL')}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {metadata.entity_id && (
                    <div>
                      <Label className="text-xs">Entity ID</Label>
                      <div className="flex gap-2 mt-1">
                        <Input readOnly value={metadata.entity_id} className="font-mono text-xs" />
                        <Button size="icon" variant="outline" onClick={() => copy(metadata.entity_id, 'Entity ID')}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {metadata.metadata_xml && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs">SP Metadata XML</Label>
                        <Button size="sm" variant="outline" onClick={() => {
                          const blob = new Blob([metadata.metadata_xml], { type: 'application/xml' });
                          const a = document.createElement('a');
                          a.href = URL.createObjectURL(blob);
                          a.download = `sp-metadata-${form.nome ?? 'sso'}.xml`;
                          a.click();
                        }}>
                          <Download className="h-3 w-3 mr-1" />Baixar
                        </Button>
                      </div>
                      <Textarea readOnly value={metadata.metadata_xml} rows={6} className="font-mono text-xs" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Alert>
              <AlertDescription className="text-sm">
                <strong>Próximo passo:</strong> após salvar, abra um chamado no suporte Lovable Cloud
                anexando a metadata SP gerada para finalizar a ativação SAML server-side.
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <Label>Ativar provedor agora</Label>
                <p className="text-xs text-muted-foreground">Permite que usuários comecem a fazer login</p>
              </div>
              <Switch checked={!!form.ativo} onCheckedChange={v => setForm(p => ({ ...p, ativo: v }))} />
            </div>

            <SSOConsistencyPanel
              issues={consistency.issues}
              errors={consistency.errors}
              warnings={consistency.warnings}
              infos={consistency.infos}
              onAutofix={applyAutofix}
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={prev} disabled={step === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" />Voltar
          </Button>
          <span className="text-sm text-muted-foreground">
            Passo {step + 1} de {STEPS.length}
            {consistency.hasBlocker && step >= 2 && (
              <span className="ml-2 text-destructive">· {consistency.errors.length} erro(s) a resolver</span>
            )}
          </span>
          {step < 3 ? (
            <Button onClick={next} disabled={(step === 0 && !preset) || (step === 1 && !form.nome)}>
              Próximo<ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={save.isPending || consistency.hasBlocker}
              title={consistency.hasBlocker ? 'Resolva os erros de consistência antes de salvar' : undefined}
            >
              {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar provedor
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
