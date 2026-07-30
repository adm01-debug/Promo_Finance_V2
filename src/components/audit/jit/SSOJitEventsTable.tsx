import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, ExternalLink, User, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { formatDate } from '@/lib/formatters';
import { maskIp } from '@/lib/ip-mask';
import { useIpMaskPreference } from '@/hooks/useIpMaskPreference';
import type { JitAuditEvent } from '@/hooks/useSSOJitEvents';

interface Props {
  events: JitAuditEvent[];
}

const roleColor: Record<string, string> = {
  admin: 'bg-destructive/10 text-destructive border-destructive/20',
  financeiro: 'bg-primary/10 text-primary border-primary/20',
  operacional: 'bg-accent/10 text-accent border-accent/20',
  visualizador: 'bg-muted text-muted-foreground border-border',
};

export function SSOJitEventsTable({ events }: Props) {
  const { enabled: maskIpsEnabled } = useIpMaskPreference();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <ScrollArea className="h-[560px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[170px]">Data/Hora</TableHead>
            <TableHead>Usuário</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Grupos</TableHead>
            <TableHead>Via</TableHead>
            <TableHead className="w-[120px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((e) => {
            const nd = e.new_data ?? {};
            const groups = nd.groups_received ?? [];
            const matched = nd.matched_group;
            return (
              <TableRow key={e.id}>
                <TableCell className="text-sm">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {formatDate(e.created_at)}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(e.created_at), 'HH:mm:ss')}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm truncate max-w-[180px]">{e.user_email || '—'}</span>
                  </div>
                  {e.ip_address && (
                    <span className="text-xs text-muted-foreground">
                      {maskIp(e.ip_address, maskIpsEnabled)}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">{nd.provider_nome ?? '—'}</span>
                    {nd.provider_tipo && (
                      <Badge variant="outline" className="w-fit text-[10px] uppercase">
                        {nd.provider_tipo}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {nd.role ? (
                    <Badge variant="outline" className={roleColor[nd.role] ?? ''}>
                      {nd.role}
                    </Badge>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  {matched ? (
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      grupo: {matched}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-muted text-muted-foreground">
                      default
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {groups.length === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help underline decoration-dotted">
                            {groups.slice(0, 2).join(', ')}
                            {groups.length > 2 && ` +${groups.length - 2}`}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs whitespace-pre-line">{groups.join('\n')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{nd.via ?? '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Dialog open={openId === e.id} onOpenChange={(o) => setOpenId(o ? e.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle>Detalhes do Provisionamento JIT</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="max-h-[60vh]">
                          <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-muted-foreground">Usuário</p>
                                <p>{e.user_email || '—'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">IP</p>
                                <p>{maskIp(e.ip_address, maskIpsEnabled)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Data</p>
                                <p>{formatDate(e.created_at)} {format(new Date(e.created_at), 'HH:mm:ss')}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Via</p>
                                <p>{nd.via ?? '—'}</p>
                              </div>
                            </div>
                            {e.details && (
                              <div>
                                <p className="text-muted-foreground">Detalhes</p>
                                <p>{e.details}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-muted-foreground mb-1">Payload completo</p>
                              <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-[280px]">
                                {JSON.stringify(nd, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Ver no log completo">
                      <Link to={`/audit-logs`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
