import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, User, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { formatDate } from '@/lib/formatters';
import { maskIp } from '@/lib/ip-mask';
import { useIpMaskPreference } from '@/hooks/useIpMaskPreference';
import { AuditDiffView } from './AuditDiffView';

type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'APPROVE' | 'REJECT';

interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: AuditAction;
  table_name: string | null;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  details: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const actionConfig: Record<AuditAction, { label: string; color: string }> = {
  INSERT: { label: 'Criação', color: 'bg-success/10 text-success border-success/20' },
  UPDATE: { label: 'Atualização', color: 'bg-accent/10 text-accent border-accent/20' },
  DELETE: { label: 'Exclusão', color: 'bg-destructive/10 text-destructive border-destructive/20' },
  LOGIN: { label: 'Login', color: 'bg-primary/10 text-primary border-primary/20' },
  LOGOUT: { label: 'Logout', color: 'bg-muted text-muted-foreground border-border' },
  EXPORT: { label: 'Exportação', color: 'bg-secondary/10 text-secondary border-secondary/20' },
  APPROVE: { label: 'Aprovação', color: 'bg-success/10 text-success border-success/20' },
  REJECT: { label: 'Rejeição', color: 'bg-destructive/10 text-destructive border-destructive/20' },
};

const tableNameLabels: Record<string, string> = {
  contas_pagar: 'Contas a Pagar', contas_receber: 'Contas a Receber', notas_fiscais: 'Notas Fiscais',
  empresas: 'Empresas', clientes: 'Clientes', fornecedores: 'Fornecedores',
  contas_bancarias: 'Contas Bancárias', centros_custo: 'Centros de Custo',
  user_roles: 'Perfis de Usuário', profiles: 'Perfis',
  sso_jit_provisioning: 'Provisionamento SSO (JIT)',
  sso_profile_sync: 'Sincronização de Perfil (SSO)',
  sso_magic_link_issued: 'Magic Link SSO',
};

interface Props {
  logs: AuditLog[];
}

export function AuditLogTable({ logs }: Props) {
  const { enabled: maskIpsEnabled } = useIpMaskPreference();
  return (
    <ScrollArea className="h-[500px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Data/Hora</TableHead>
            <TableHead>Usuário</TableHead>
            <TableHead>Ação</TableHead>
            <TableHead>Tabela</TableHead>
            <TableHead>Detalhes</TableHead>
            <TableHead className="w-[80px]">Ver</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="text-sm">
                <div className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-muted-foreground" />{formatDate(log.created_at)}</div>
                <span className="text-xs text-muted-foreground">{format(new Date(log.created_at), 'HH:mm:ss')}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5"><User className="h-3 w-3 text-muted-foreground" /><span className="text-sm truncate max-w-[150px]">{log.user_email || 'Sistema'}</span></div>
                {log.ip_address && <span className="text-xs text-muted-foreground">{maskIp(log.ip_address, maskIpsEnabled)}</span>}
              </TableCell>
              <TableCell><Badge variant="outline" className={actionConfig[log.action]?.color}>{actionConfig[log.action]?.label || log.action}</Badge></TableCell>
              <TableCell className="text-sm">{log.table_name ? (tableNameLabels[log.table_name] || log.table_name) : '-'}</TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{log.details || '-'}</TableCell>
              <TableCell>
                <Dialog>
                  <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button></DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh]">
                    <DialogHeader><DialogTitle>Detalhes do Log</DialogTitle></DialogHeader>
                    <ScrollArea className="max-h-[60vh]">
                      <div className="space-y-4 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div><p className="text-muted-foreground">Ação</p><Badge variant="outline" className={actionConfig[log.action]?.color}>{actionConfig[log.action]?.label}</Badge></div>
                          <div><p className="text-muted-foreground">Tabela</p><p>{log.table_name ? (tableNameLabels[log.table_name] || log.table_name) : '-'}</p></div>
                          <div><p className="text-muted-foreground">Usuário</p><p>{log.user_email || 'Sistema'}</p></div>
                          <div><p className="text-muted-foreground">IP</p><p>{maskIp(log.ip_address, maskIpsEnabled)}</p></div>
                        </div>
                        {log.details && <div><p className="text-muted-foreground">Detalhes</p><p>{log.details}</p></div>}
                        {(log.old_data || log.new_data) && (
                          <div>
                            <p className="text-muted-foreground mb-2">Comparação antes/depois</p>
                            <AuditDiffView old={log.old_data} new={log.new_data} action={log.action} />
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
