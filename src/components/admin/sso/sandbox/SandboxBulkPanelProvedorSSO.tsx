import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Play, Square, Download } from 'lucide-react';
import type { AppRole, SSOProvider } from '@/hooks/useSSO';
import type { BulkResult } from '@/lib/sso/sandbox-bulk-runner';

interface SandboxBulkPanelProvedorSSOProps {
  providerId: string;
  setProviderId: import('react').Dispatch<import('react').SetStateAction<string>>;
  providers: SSOProvider[];
  useProviderConfig: boolean;
  setUseProviderConfig: import('react').Dispatch<import('react').SetStateAction<boolean>>;
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
  persistHistory: boolean;
  setPersistHistory: import('react').Dispatch<import('react').SetStateAction<boolean>>;
  running: boolean;
  progress: { done: number; total: number };
  execute: () => Promise<void>;
  parsed: import('@/lib/sso/sandbox-csv').ParsedCsv;
  cancel: () => void;
  results: BulkResult[];
  exportCsv: () => void;
}

export function SandboxBulkPanelProvedorSSO({
  providerId,
  setProviderId,
  providers,
  useProviderConfig,
  setUseProviderConfig,
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
  persistHistory,
  setPersistHistory,
  running,
  progress,
  execute,
  parsed,
  cancel,
  results,
  exportCsv,
}: SandboxBulkPanelProvedorSSOProps) {
  return (
    <CardContent className="space-y-3">
      <div className="space-y-2">
        <Label className="text-xs">Provedor SSO</Label>
        <Select value={providerId} onValueChange={setProviderId}>
          <SelectTrigger className="h-9">
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

      <div className="flex items-center justify-between rounded-lg border p-2.5">
        <div>
          <Label className="cursor-pointer text-sm">Usar configuração do provider</Label>
          <p className="text-[11px] text-muted-foreground">Ignora os campos manuais abaixo.</p>
        </div>
        <Switch
          checked={useProviderConfig}
          onCheckedChange={setUseProviderConfig}
          disabled={!providerId}
        />
      </div>

      {(!useProviderConfig || !providerId) && (
        <div className="space-y-2 rounded-lg border p-2.5 bg-muted/30">
          <p className="text-[11px] font-semibold text-muted-foreground">Configuração manual</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-[10px]">Claim email</Label>
              <Input
                className="h-8 text-xs"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-[10px]">Claim nome</Label>
              <Input
                className="h-8 text-xs"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-[10px]">Claim grupos</Label>
              <Input
                className="h-8 text-xs"
                value={manualGroups}
                onChange={(e) => setManualGroups(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px]">Papel padrão</Label>
              <Select value={manualRole} onValueChange={(v) => setManualRole(v as AppRole)}>
                <SelectTrigger className="h-8 text-xs">
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
              <Label className="text-[10px]">Domínios permitidos</Label>
              <Input
                className="h-8 text-xs"
                value={manualDomains}
                onChange={(e) => setManualDomains(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label className="text-[10px]">Mapeamentos grupo:role</Label>
            <Textarea
              rows={3}
              className="font-mono text-[11px]"
              value={manualMappings}
              onChange={(e) => setManualMappings(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg border p-2.5">
        <div>
          <Label className="cursor-pointer text-sm">Salvar runs no histórico</Label>
          <p className="text-[11px] text-muted-foreground">
            Persiste cada usuário do lote em <code>sso_sandbox_runs</code> com o mesmo{' '}
            <code>batch_id</code>.
          </p>
        </div>
        <Switch checked={persistHistory} onCheckedChange={setPersistHistory} />
      </div>

      {running && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span>Progresso</span>
            <span className="font-mono text-muted-foreground">
              {progress.done}/{progress.total}
            </span>
          </div>
          <Progress
            value={progress.total ? (progress.done / progress.total) * 100 : 0}
            className="h-2"
          />
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
            <Square className="h-4 w-4" />
            Cancelar
          </Button>
        )}
        {results.length > 0 && !running && (
          <Button variant="outline" onClick={exportCsv} className="gap-2">
            <Download className="h-4 w-4" />
            CSV
          </Button>
        )}
      </div>
    </CardContent>
  );
}
