import { useState, useMemo } from 'react';
import { Building2, Check, LogOut, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  useUserEmpresas,
  useDefinirEmpresaPadrao,
  setCurrentEmpresaId,
  type UserEmpresaLink,
} from '@/hooks/useUserEmpresas';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface EmpresaSelectionGateProps {
  onSelected: () => void;
}

export function EmpresaSelectionGate({ onSelected }: EmpresaSelectionGateProps) {
  const { data: vinculos = [], isLoading } = useUserEmpresas();
  const { signOut, profile } = useAuth();
  const definirPadrao = useDefinirEmpresaPadrao();

  const sorted = useMemo(
    () => [...vinculos].sort((a, b) => Number(b.is_default) - Number(a.is_default)),
    [vinculos],
  );

  const [selectedId, setSelectedId] = useState<string | null>(
    () => sorted.find((v) => v.is_default)?.id ?? sorted[0]?.id ?? null,
  );
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selected = sorted.find((v) => v.id === selectedId) ?? null;

  const handleContinue = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      if (setAsDefault && !selected.is_default) {
        await definirPadrao.mutateAsync(selected.id);
      }
      setCurrentEmpresaId(selected.empresa_id);
      onSelected();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle>Escolha a empresa para acessar</CardTitle>
              <CardDescription>
                {profile?.email && <span className="text-xs">{profile.email} · </span>}
                {isLoading
                  ? 'Carregando vínculos…'
                  : vinculos.length === 0
                  ? 'Nenhum vínculo ativo encontrado'
                  : `Você está vinculado a ${vinculos.length} ${vinculos.length === 1 ? 'empresa' : 'empresas'}`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : vinculos.length === 0 ? (
            <NoVinculosState onSignOut={signOut} />
          ) : (
            <>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {sorted.map((v) => (
                  <EmpresaCard
                    key={v.id}
                    vinculo={v}
                    selected={v.id === selectedId}
                    onSelect={() => setSelectedId(v.id)}
                  />
                ))}
              </div>

              {selected && !selected.is_default && (
                <Checkbox
                  checked={setAsDefault}
                  onChange={(e) => setSetAsDefault(e.target.checked)}
                  label="Definir como minha empresa padrão"
                  description="Em próximos logins, esta empresa será sugerida automaticamente."
                />
              )}

              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  variant="ghost"
                  onClick={signOut}
                  disabled={submitting}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </Button>
                <Button
                  onClick={handleContinue}
                  disabled={!selected || submitting}
                  className="gap-2"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Continuar
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmpresaCard({
  vinculo,
  selected,
  onSelect,
}: {
  vinculo: UserEmpresaLink;
  selected: boolean;
  onSelect: () => void;
}) {
  const nome = vinculo.empresa.nome_fantasia || vinculo.empresa.razao_social;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'w-full text-left rounded-lg border p-4 transition-all',
        'hover:border-primary/60 hover:bg-accent/40',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0',
            selected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40',
          )}
        >
          {selected && <Check className="h-3 w-3" strokeWidth={3} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate">{nome}</span>
            {vinculo.is_default && (
              <Badge variant="secondary" className="text-[10px] uppercase">Padrão</Badge>
            )}
          </div>
          {vinculo.empresa.razao_social !== nome && (
            <p className="text-xs text-muted-foreground truncate">{vinculo.empresa.razao_social}</p>
          )}
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span>CNPJ {vinculo.empresa.cnpj}</span>
            <span>·</span>
            <Badge variant="outline" className="text-[10px] uppercase">{vinculo.role}</Badge>
            {vinculo.provisioned_via === 'sso' && (
              <Badge variant="outline" className="text-[10px] uppercase">SSO</Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function NoVinculosState({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div className="text-center py-8 space-y-4">
      <div className="mx-auto h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
        <AlertCircle className="h-6 w-6 text-warning" />
      </div>
      <div className="space-y-1">
        <h3 className="font-medium">Nenhuma empresa vinculada</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Sua conta ainda não possui vínculo com nenhuma empresa. Solicite ao administrador
          da sua organização para liberar o acesso.
        </p>
      </div>
      <Button variant="outline" onClick={onSignOut} className="gap-2">
        <LogOut className="h-4 w-4" />
        Sair
      </Button>
    </div>
  );
}
