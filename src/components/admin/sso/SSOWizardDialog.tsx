import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { IDP_PRESETS } from './IdpPresets';
import type { IdpPreset } from './IdpPresets';
import { useSaveSSOProvider, useSaveSSORoleMappings, useSSORoleMappings } from '@/hooks/useSSO';
import type { SSOProvider, AppRole } from '@/hooks/useSSO';
import { useSSOConsistency } from '@/hooks/useSSOConsistency';
import { SSOStepConexao } from './SSOStepConexao';
import { SSOStepValidacao } from './SSOStepValidacao';
import type { AutoFix } from '@/lib/sso/consistency';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Props } from './SSOWizardDialog.types';
import { STEPS } from './SSOWizardDialog.helpers';
import { SSOWizardDialogDominiosEmailPermitidos } from './SSOWizardDialogDominiosEmailPermitidos';

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
  const [roleMappings, setRoleMappings] = useState<Array<{ idp_group: string; app_role: AppRole }>>(
    []
  );

  const save = useSaveSSOProvider();
  const saveMappings = useSaveSSORoleMappings();
  const { data: existingMappings } = useSSORoleMappings(editing?.id);

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm(editing);
        setPreset(IDP_PRESETS.find((p) => p.id === editing.preset) ?? null);
        setStep(1);
      } else {
        setForm({
          tipo: 'oidc',
          ativo: false,
          allowed_domains: [],
          default_role: 'visualizador',
          auto_provision_users: true,
          force_sso_for_domains: false,
          scopes: ['openid', 'profile', 'email'],
          claim_mapping: { email: 'email', full_name: 'name', groups: 'groups' },
        });
        setPreset(null);
        setStep(0);
        setRoleMappings([]);
      }
    }
  }, [open, editing]);

  useEffect(() => {
    if (existingMappings?.length) {
      setRoleMappings(
        existingMappings.map((m) => ({ idp_group: m.idp_group, app_role: m.app_role }))
      );
    }
  }, [existingMappings]);

  const selectPreset = (p: IdpPreset) => {
    setPreset(p);
    setForm((prev) => ({
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
      setForm((p) => ({ ...p, allowed_domains: [...(p.allowed_domains ?? []), d] }));
      setDomainInput('');
    }
  };

  const handleSave = async () => {
    const saved = await save.mutateAsync(
      form as Partial<SSOProvider> & { nome: string; tipo: NonNullable<typeof form.tipo> }
    );
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
      setForm((p) => ({
        ...p,
        claim_mapping: {
          ...p.claim_mapping,
          ...patch.claim_mapping,
        } as SSOProvider['claim_mapping'],
      }));
    }
    if (patch.default_role !== undefined) {
      setForm((p) => ({ ...p, default_role: patch.default_role as AppRole }));
    }
    if (patch.role_mappings !== undefined) {
      setRoleMappings(patch.role_mappings as Array<{ idp_group: string; app_role: AppRole }>);
    }
    toast.success('Correção aplicada');
  };

  const next = () => setStep((s) => Math.min(s + 1, 3));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

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
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium transition-colors',
                  i < step && 'bg-success border-success text-success-foreground',
                  i === step && 'border-primary bg-primary text-primary-foreground',
                  i > step && 'border-border text-muted-foreground'
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn('ml-2 text-sm hidden sm:inline', i === step && 'font-medium')}>
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={cn('flex-1 h-0.5 mx-3', i < step ? 'bg-success' : 'bg-border')} />
              )}
            </div>
          ))}
        </div>

        {/* Step 0: Tipo */}
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Selecione seu provedor de identidade:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {IDP_PRESETS.map((p) => (
                <Card
                  key={p.id}
                  onClick={() => selectPreset(p)}
                  className={cn(
                    'cursor-pointer transition-all hover:border-primary hover:shadow-md',
                    preset?.id === p.id && 'border-primary ring-2 ring-primary/20'
                  )}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl mb-2">{p.logo}</div>
                    <div className="font-medium text-sm">{p.nome}</div>
                    <Badge variant="outline" className="mt-2 text-xs uppercase">
                      {p.tipo}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Conexão */}
        {step === 1 && <SSOStepConexao form={form} setForm={setForm} preset={preset} />}

        {/* Step 2: Mapeamento */}
        {step === 2 && (
          <SSOWizardDialogDominiosEmailPermitidos
            domainInput={domainInput}
            setDomainInput={setDomainInput}
            addDomain={addDomain}
            form={form}
            setForm={setForm}
            setRoleMappings={setRoleMappings}
            roleMappings={roleMappings}
            consistency={consistency}
            applyAutofix={applyAutofix}
          />
        )}

        {/* Step 3: Validação */}
        {step === 3 && (
          <SSOStepValidacao
            form={form}
            setForm={setForm}
            consistency={consistency}
            applyAutofix={applyAutofix}
          />
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={prev} disabled={step === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <span className="text-sm text-muted-foreground">
            Passo {step + 1} de {STEPS.length}
            {consistency.hasBlocker && step >= 2 && (
              <span className="ml-2 text-destructive">
                · {consistency.errors.length} erro(s) a resolver
              </span>
            )}
          </span>
          {step < 3 ? (
            <Button onClick={next} disabled={(step === 0 && !preset) || (step === 1 && !form.nome)}>
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={save.isPending || consistency.hasBlocker}
              title={
                consistency.hasBlocker
                  ? 'Resolva os erros de consistência antes de salvar'
                  : undefined
              }
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
