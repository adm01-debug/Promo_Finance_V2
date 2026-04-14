import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Search, Plus, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string | null;
  blocked_at: string;
  permanent: boolean;
  unblocked_at: string | null;
}

interface Props {
  blockedIPs: BlockedIP[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onBlockNew: () => void;
  onUnblock: (id: string) => void;
}

export function BlockedIPsTab({ blockedIPs, searchTerm, onSearchChange, onBlockNew, onUnblock }: Props) {
  const filtered = blockedIPs.filter(ip =>
    !ip.unblocked_at && (ip.ip_address.includes(searchTerm) || (ip.reason?.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div><CardTitle>IPs Bloqueados</CardTitle><CardDescription>Gerencie os endereços IP bloqueados no sistema</CardDescription></div>
          <Button onClick={onBlockNew} className="gap-2"><Plus className="h-4 w-4" />Bloquear IP</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar IP ou motivo..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} className="pl-10" />
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground"><Shield className="h-12 w-12 mx-auto mb-3 opacity-20" /><p>Nenhum IP bloqueado</p></div>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>IP</TableHead><TableHead>Motivo</TableHead><TableHead>Bloqueado em</TableHead><TableHead>Tipo</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map((ip) => (
                <TableRow key={ip.id}>
                  <TableCell className="font-mono">{ip.ip_address}</TableCell>
                  <TableCell>{ip.reason || '-'}</TableCell>
                  <TableCell>{format(new Date(ip.blocked_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                  <TableCell><Badge variant={ip.permanent ? 'destructive' : 'secondary'}>{ip.permanent ? 'Permanente' : 'Temporário'}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="sm" onClick={() => onUnblock(ip.id)}><CheckCircle2 className="h-4 w-4 mr-1" />Desbloquear</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
