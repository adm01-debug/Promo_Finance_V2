import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink } from 'lucide-react';
import type { SSOProvider } from '@/hooks/useSSO';
import type { IdpPreset } from './IdpPresets';

interface Props {
  form: Partial<SSOProvider>;
  setForm: React.Dispatch<React.SetStateAction<Partial<SSOProvider>>>;
  preset: IdpPreset | null;
}

export function SSOStepConexao({ form, setForm, preset }: Props) {
  return (
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
  );
}
