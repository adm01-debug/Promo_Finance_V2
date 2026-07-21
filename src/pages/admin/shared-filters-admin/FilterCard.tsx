import { Shield, ShieldOff, Trash2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ROLE_LABEL,
  ROLE_OPTIONS,
  type AppRole,
  type EmpresaLite,
  type ProfileLite,
  type SharedFilterRow,
} from './types';

interface FilterCardProps {
  row: SharedFilterRow;
  owner?: ProfileLite;
  empresa?: EmpresaLite;
  onToggleRole: (role: AppRole) => void;
  onRevoke: () => void;
  busy: boolean;
}

export function FilterCard({
  row,
  owner,
  empresa,
  onToggleRole,
  onRevoke,
  busy,
}: FilterCardProps) {
  const activeRoles = new Set(row.shared_with_roles);
  const empresaLabel =
    empresa?.nome_fantasia ?? empresa?.razao_social ?? row.empresa_id ?? '—';
  const ownerLabel = owner?.full_name || owner?.email || row.user_id;

  return (
    <div className="rounded-lg border border-border bg-card/60 p-4 hover:bg-card transition-colors">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{row.name}</span>
            <Badge variant="outline" className="text-[10px]">
              {row.entity_type}
            </Badge>
            {row.is_default && (
              <Badge variant="secondary" className="text-[10px]">
                Padrão
              </Badge>
            )}
          </div>
          <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
            <div>
              <span className="text-foreground font-medium">Dono:</span>{' '}
              {ownerLabel}
              {owner?.email && owner.full_name ? (
                <span className="opacity-70"> ({owner.email})</span>
              ) : null}
            </div>
            <div>
              <span className="text-foreground font-medium">Empresa:</span>{' '}
              {empresaLabel}
            </div>
            <div>
              <span className="text-foreground font-medium">Atualizado em:</span>{' '}
              {new Date(row.updated_at).toLocaleString('pt-BR')}
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                className="gap-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
                Revogar tudo
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Revogar compartilhamento?</AlertDialogTitle>
                <AlertDialogDescription>
                  O filtro <strong>{row.name}</strong> deixará de ser
                  compartilhado. O dono ainda pode usá-lo em sua biblioteca
                  pessoal. Esta ação será registrada na auditoria.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onRevoke}>
                  Confirmar revogação
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Separator className="my-3" />

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          Papéis com acesso
          {activeRoles.size === 0 && (
            <Badge
              variant="outline"
              className="text-[10px] border-warning/40 text-warning"
            >
              Todos os papéis da empresa
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {ROLE_OPTIONS.map((role) => {
            const active = activeRoles.has(role);
            return (
              <Button
                key={role}
                size="sm"
                variant={active ? 'default' : 'outline'}
                disabled={busy}
                onClick={() => onToggleRole(role)}
                className="gap-1 h-7"
              >
                {active ? (
                  <Shield className="h-3 w-3" />
                ) : (
                  <ShieldOff className="h-3 w-3 opacity-60" />
                )}
                {ROLE_LABEL[role]}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
