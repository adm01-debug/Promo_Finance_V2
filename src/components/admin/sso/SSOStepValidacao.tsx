import { useState } from 'react';
import { Loader2, Check, X, Copy, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTestSSOConfig, useGenerateSSOMetadata, type SSOProvider } from '@/hooks/useSSO';
import { useSSOConsistency } from '@/hooks/useSSOConsistency';
import { SSOConsistencyPanel } from './SSOConsistencyPanel';
import type { AutoFix } from '@/lib/sso/consistency';

interface Props {
  form: Partial<SSOProvider>;
  setForm: React.Dispatch<React.SetStateAction<Partial<SSOProvider>>>;
  consistency: ReturnType<typeof useSSOConsistency>;
  applyAutofix: (patch: AutoFix['patch']) => void;
}

export function SSOStepValidacao({ form, setForm, consistency, applyAutofix }: Props) {
  const [metadata, setMetadata] = useState<{
    callback_url?: string; acs_url?: string; entity_id?: string; metadata_xml?: string;
  } | null>(null);
  const [testResult, setTestResult] = useState<{
    valid: boolean; message: string; discovered?: Record<string, unknown>;
  } | null>(null);
  const test = useTestSSOConfig();
  const genMeta = useGenerateSSOMetadata();

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

  return (
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
  );
}
