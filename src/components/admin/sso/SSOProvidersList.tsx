import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Edit, Trash2, KeyRound, ShieldCheck, AlertCircle, Plus, Globe } from 'lucide-react';
import { useSSOProviders, useDeleteSSOProvider, useToggleSSOProvider, type SSOProvider } from '@/hooks/useSSO';
import { IDP_PRESETS } from './IdpPresets';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  onEdit: (p: SSOProvider) => void;
  onCreate: () => void;
}

export function SSOProvidersList({ onEdit, onCreate }: Props) {
  const { data: providers, isLoading } = useSSOProviders();
  const del = useDeleteSSOProvider();
  const toggle = useToggleSSOProvider();

  if (isLoading) {
    return <div className="grid gap-4 md:grid-cols-2">{[1, 2].map(i => <Skeleton key={i} className="h-40" />)}</div>;
  }

  if (!providers?.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Nenhum provedor SSO configurado</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            Configure SSO empresarial (Azure AD, Okta, Google Workspace) para permitir
            que usuários da sua organização façam login com suas credenciais corporativas.
          </p>
          <Button onClick={onCreate} size="lg">
            <Plus className="h-4 w-4 mr-2" /> Adicionar primeiro provedor
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onCreate}><Plus className="h-4 w-4 mr-2" />Adicionar provedor</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {providers.map((p, i) => {
          const preset = IDP_PRESETS.find(x => x.id === p.preset);
          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="text-3xl shrink-0" style={{ color: preset?.cor }}>{preset?.logo ?? '🔐'}</div>
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{p.nome}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="uppercase text-xs">{p.tipo}</Badge>
                          {p.force_sso_for_domains && (
                            <Badge variant="secondary" className="text-xs">
                              <ShieldCheck className="h-3 w-3 mr-1" />Forçado
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={p.ativo}
                      onCheckedChange={(v) => toggle.mutate({ id: p.id, ativo: v })}
                    />
                  </div>

                  {p.allowed_domains.length > 0 && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
                      <Globe className="h-4 w-4 mt-0.5 shrink-0" />
                      <div className="flex flex-wrap gap-1">
                        {p.allowed_domains.slice(0, 3).map(d => (
                          <Badge key={d} variant="outline" className="text-xs">@{d}</Badge>
                        ))}
                        {p.allowed_domains.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{p.allowed_domains.length - 3}</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {p.ultimo_teste_em && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                      {p.ultimo_teste_sucesso ? (
                        <ShieldCheck className="h-3 w-3 text-success" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-destructive" />
                      )}
                      Último teste: {format(new Date(p.ultimo_teste_em), "dd/MM HH:mm", { locale: ptBR })}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit(p)} className="flex-1">
                      <Edit className="h-3 w-3 mr-1" />Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover provedor?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Os usuários desta organização não poderão mais fazer login via {p.nome}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => del.mutate(p.id)}>Remover</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
