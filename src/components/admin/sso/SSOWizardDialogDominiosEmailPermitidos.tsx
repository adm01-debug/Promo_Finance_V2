import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { ChevronRight, Plus, Trash2, X } from 'lucide-react';
import type { SSOProvider, AppRole } from '@/hooks/useSSO';
import { SSOConsistencyPanel } from './SSOConsistencyPanel';
import type { AutoFix } from '@/lib/sso/consistency';
import { ROLES } from './SSOWizardDialog.helpers';

interface SSOWizardDialogDominiosEmailPermitidosProps {
  domainInput: string;
  setDomainInput: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
  addDomain: () => void;
  form: Partial<SSOProvider>;
  setForm: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<
      Partial<SSOProvider>
    >
  >;
  setRoleMappings: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<
      { idp_group: string; app_role: AppRole }[]
    >
  >;
  roleMappings: { idp_group: string; app_role: AppRole }[];
  consistency: {
    issues: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/lib/sso/consistency').ConsistencyIssue[];
    errors: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/lib/sso/consistency').ConsistencyIssue[];
    warnings: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/lib/sso/consistency').ConsistencyIssue[];
    infos: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/lib/sso/consistency').ConsistencyIssue[];
    hasBlocker: boolean;
    total: number;
  };
  applyAutofix: (patch: AutoFix['patch']) => void;
}

export function SSOWizardDialogDominiosEmailPermitidos({
  domainInput,
  setDomainInput,
  addDomain,
  form,
  setForm,
  setRoleMappings,
  roleMappings,
  consistency,
  applyAutofix,
}: SSOWizardDialogDominiosEmailPermitidosProps) {
  return (
    <div className="space-y-5">
      <div>
        <Label>Domínios de e-mail permitidos</Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDomain())}
            placeholder="empresa.com.br"
          />
          <Button type="button" onClick={addDomain}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {form.allowed_domains?.map((d) => (
            <Badge key={d} variant="secondary" className="gap-1">
              @{d}
              <button
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    allowed_domains: p.allowed_domains?.filter((x) => x !== d),
                  }))
                }
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Claim de e-mail</Label>
          <Input
            value={form.claim_mapping?.email ?? ''}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                claim_mapping: { ...p.claim_mapping!, email: e.target.value },
              }))
            }
          />
        </div>
        <div>
          <Label className="text-xs">Claim de nome</Label>
          <Input
            value={form.claim_mapping?.full_name ?? ''}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                claim_mapping: { ...p.claim_mapping!, full_name: e.target.value },
              }))
            }
          />
        </div>
        <div>
          <Label className="text-xs">Claim de grupos</Label>
          <Input
            value={form.claim_mapping?.groups ?? ''}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                claim_mapping: { ...p.claim_mapping!, groups: e.target.value },
              }))
            }
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Mapeamento grupo → papel</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setRoleMappings((m) => [...m, { idp_group: '', app_role: 'visualizador' }])
            }
          >
            <Plus className="h-3 w-3 mr-1" />
            Adicionar
          </Button>
        </div>
        <div className="space-y-2">
          {roleMappings.map((m, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                placeholder="Grupo no IdP (ex: Finance-Admins)"
                value={m.idp_group}
                onChange={(e) =>
                  setRoleMappings((arr) =>
                    arr.map((x, j) => (j === i ? { ...x, idp_group: e.target.value } : x))
                  )
                }
              />
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select
                value={m.app_role}
                onValueChange={(v: AppRole) =>
                  setRoleMappings((arr) => arr.map((x, j) => (j === i ? { ...x, app_role: v } : x)))
                }
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setRoleMappings((arr) => arr.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          {!roleMappings.length && (
            <p className="text-xs text-muted-foreground">
              Nenhum mapeamento. Usuários receberão o papel padrão.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Papel padrão (sem grupo correspondente)</Label>
          <Select
            value={form.default_role}
            onValueChange={(v: AppRole) => setForm((p) => ({ ...p, default_role: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t">
        <div className="flex items-center justify-between">
          <div>
            <Label>Auto-provisionar usuários</Label>
            <p className="text-xs text-muted-foreground">
              Cria conta automaticamente no primeiro login
            </p>
          </div>
          <Switch
            checked={!!form.auto_provision_users}
            onCheckedChange={(v) => setForm((p) => ({ ...p, auto_provision_users: v }))}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>Forçar SSO para os domínios permitidos</Label>
            <p className="text-xs text-muted-foreground">
              Bloqueia login com senha para esses domínios
            </p>
          </div>
          <Switch
            checked={!!form.force_sso_for_domains}
            onCheckedChange={(v) => setForm((p) => ({ ...p, force_sso_for_domains: v }))}
          />
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
  );
}
