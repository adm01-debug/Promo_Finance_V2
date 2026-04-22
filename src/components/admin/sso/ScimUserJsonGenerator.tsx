import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Copy, AlertTriangle, CheckCircle2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { buildScimUserPayload } from '@/lib/scim/userTemplate';

export function ScimUserJsonGenerator() {
  const [userName, setUserName] = useState('');
  const [externalId, setExternalId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [active, setActive] = useState(true);

  const result = useMemo(
    () => buildScimUserPayload({ userName, externalId, displayName, workEmail, active }),
    [userName, externalId, displayName, workEmail, active],
  );

  const errors = result.issues.filter((i) => i.level === 'error');
  const warnings = result.issues.filter((i) => i.level === 'warning');

  const handleCopy = async () => {
    if (!result.isValid) {
      toast.error('Corrija os erros antes de copiar', {
        description: errors.map((e) => `• ${e.message}`).join('\n'),
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(result.json);
      toast.success('JSON SCIM copiado', {
        description:
          result.adjustments.length > 0
            ? `Ajustes aplicados:\n${result.adjustments.map((a) => `• ${a}`).join('\n')}`
            : 'Payload validado conforme o template /Users.',
      });
    } catch {
      toast.error('Falha ao copiar para a área de transferência');
    }
  };

  const fillExample = () => {
    setUserName('alice@empresa.com');
    setExternalId('a1b2c3d4-1234-5678-90ab-cdef00112233');
    setDisplayName('Alice Souza');
    setWorkEmail('alice@empresa.com');
    setActive(true);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Gerador de payload SCIM User</CardTitle>
            <CardDescription>
              Preencha os campos para validar e gerar um JSON compatível com o nosso endpoint{' '}
              <code>POST /Users</code>. O botão "Copiar JSON" só fica ativo quando o payload é válido.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={fillExample} className="shrink-0">
            <Wand2 className="h-3.5 w-3.5 mr-1.5" /> Exemplo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="scim-userName">
              userName <Badge variant="outline" className="ml-1 text-[10px]">obrigatório</Badge>
            </Label>
            <Input
              id="scim-userName"
              placeholder="usuario@empresa.com"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="scim-externalId">
              externalId <Badge variant="outline" className="ml-1 text-[10px]">obrigatório</Badge>
            </Label>
            <Input
              id="scim-externalId"
              placeholder="objectId / user.id"
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="scim-displayName">name.formatted</Label>
            <Input
              id="scim-displayName"
              placeholder="Nome completo do usuário"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="scim-workEmail">emails[work].value</Label>
            <Input
              id="scim-workEmail"
              placeholder="usuario@empresa.com"
              value={workEmail}
              onChange={(e) => setWorkEmail(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-2 rounded-md border bg-muted/30">
          <div className="text-sm">
            <span className="font-medium">active</span>
            <span className="text-xs text-muted-foreground ml-2">Status da conta no IdP</span>
          </div>
          <Switch checked={active} onCheckedChange={setActive} />
        </div>

        {errors.length > 0 && (
          <Alert variant="error">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-1">Erros impedindo a geração:</p>
              <ul className="list-disc list-inside text-xs space-y-0.5">
                {errors.map((e, i) => (
                  <li key={i}>{e.message}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {warnings.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-1">Avisos:</p>
              <ul className="list-disc list-inside text-xs space-y-0.5">
                {warnings.map((w, i) => (
                  <li key={i}>{w.message}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {result.isValid && result.adjustments.length > 0 && (
          <Alert variant="success">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-1">Pré-ajustes aplicados ao copiar:</p>
              <ul className="list-disc list-inside text-xs space-y-0.5">
                {result.adjustments.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Pré-visualização do payload</Label>
            <Button onClick={handleCopy} disabled={!result.isValid} size="sm">
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Copiar JSON
            </Button>
          </div>
          <pre className="text-xs font-mono bg-muted/50 border rounded-md p-3 overflow-x-auto max-h-72">
            {result.json}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
