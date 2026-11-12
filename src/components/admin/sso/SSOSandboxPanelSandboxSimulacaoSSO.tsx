import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FlaskConical, CheckCircle2, XCircle, Play, Target } from 'lucide-react';
import type { AppRole } from '@/hooks/useSSO';
import { IDP_PRESETS } from './IdpPresets';
import { MOCK_PRESETS, FOCUS_CHIPS } from './sandbox/types';
import type { FocusClaim } from './sandbox/types';

interface SSOSandboxPanelSandboxSimulacaoSSOProps {
  providerId: string;
  setProviderId: import('react').Dispatch<import('react').SetStateAction<string>>;
  providers: import('@/hooks/useSSO').SSOProvider[];
  useProviderConfig: boolean;
  setUseProviderConfig: import('react').Dispatch<import('react').SetStateAction<boolean>>;
  focusClaim: FocusClaim;
  setFocusClaim: import('react').Dispatch<import('react').SetStateAction<FocusClaim>>;
  loadPreset: (presetId: string) => void;
  claimsJson: string;
  setClaimsJson: import('react').Dispatch<import('react').SetStateAction<string>>;
  jsonError: string | null;
  manualEmail: string;
  setManualEmail: import('react').Dispatch<import('react').SetStateAction<string>>;
  manualName: string;
  setManualName: import('react').Dispatch<import('react').SetStateAction<string>>;
  manualGroups: string;
  setManualGroups: import('react').Dispatch<import('react').SetStateAction<string>>;
  manualRole: AppRole;
  setManualRole: import('react').Dispatch<import('react').SetStateAction<AppRole>>;
  manualDomains: string;
  setManualDomains: import('react').Dispatch<import('react').SetStateAction<string>>;
  manualMappings: string;
  setManualMappings: import('react').Dispatch<import('react').SetStateAction<string>>;
  simulate: () => Promise<void>;
  testMutation: import('@tanstack/react-query').UseMutationResult<
    { success: boolean; preview: Record<string, unknown>; errors: string[] },
    Error,
    Record<string, unknown>,
    unknown
  >;
}

export function SSOSandboxPanelSandboxSimulacaoSSO({
  providerId,
  setProviderId,
  providers,
  useProviderConfig,
  setUseProviderConfig,
  focusClaim,
  setFocusClaim,
  loadPreset,
  claimsJson,
  setClaimsJson,
  jsonError,
  manualEmail,
  setManualEmail,
  manualName,
  setManualName,
  manualGroups,
  setManualGroups,
  manualRole,
  setManualRole,
  manualDomains,
  setManualDomains,
  manualMappings,
  setManualMappings,
  simulate,
  testMutation,
}: SSOSandboxPanelSandboxSimulacaoSSOProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-primary" />
          Sandbox de simulação SSO
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Simule um login SSO end-to-end com claims customizadas. Nenhum usuário é criado e nenhuma
          sessão é emitida.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Provedor SSO</Label>
          <Select value={providerId} onValueChange={setProviderId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um provedor" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nome}{' '}
                  <Badge variant="outline" className="ml-2">
                    {p.tipo.toUpperCase()}
                  </Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label className="cursor-pointer">Usar configuração do provider</Label>
            <p className="text-xs text-muted-foreground">
              Quando ativo, ignora os campos manuais abaixo e usa a config real do provider
              selecionado.
            </p>
          </div>
          <Switch
            checked={useProviderConfig}
            onCheckedChange={setUseProviderConfig}
            disabled={!providerId}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" /> Claim em foco
            </Label>
            <span className="text-xs text-muted-foreground">
              Destaca a regra usada no painel ao lado
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {FOCUS_CHIPS.map((chip) => (
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
              {IDP_PRESETS.filter((p) => MOCK_PRESETS[p.id]).map((p) => (
                <Button
                  key={p.id}
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => loadPreset(p.id)}
                >
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
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" />
              JSON inválido
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-success border-success/40">
              <CheckCircle2 className="h-3 w-3" />
              JSON válido
            </Badge>
          )}
        </div>

        {(!useProviderConfig || !providerId) && (
          <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground">Configuração manual</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Claim email</Label>
                <input
                  className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Claim nome</Label>
                <input
                  className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Claim grupos</Label>
                <input
                  className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                  value={manualGroups}
                  onChange={(e) => setManualGroups(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Papel padrão</Label>
                <Select value={manualRole} onValueChange={(v) => setManualRole(v as AppRole)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">admin</SelectItem>
                    <SelectItem value="financeiro">financeiro</SelectItem>
                    <SelectItem value="operacional">operacional</SelectItem>
                    <SelectItem value="visualizador">visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Domínios permitidos (vírgula)</Label>
                <input
                  className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                  value={manualDomains}
                  onChange={(e) => setManualDomains(e.target.value)}
                  placeholder="empresa.com.br"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Mapeamentos grupo:role (1 por linha)</Label>
              <Textarea
                rows={3}
                className="font-mono text-xs"
                value={manualMappings}
                onChange={(e) => setManualMappings(e.target.value)}
              />
            </div>
          </div>
        )}

        <Button
          onClick={simulate}
          disabled={!!jsonError || testMutation.isPending}
          className="w-full gap-2"
        >
          <Play className="h-4 w-4" />
          {testMutation.isPending ? 'Simulando...' : 'Simular login'}
        </Button>
      </CardContent>
    </Card>
  );
}
