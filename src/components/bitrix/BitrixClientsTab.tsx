import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Building2 } from 'lucide-react';

interface SyncedClient {
  id: string;
  bitrix_id?: string | null;
  razao_social: string;
  email?: string | null;
  telefone?: string | null;
  cidade?: string | null;
  estado?: string | null;
}

interface Props {
  clients?: SyncedClient[];
  isLoading: boolean;
  onSyncContacts: () => void;
  onSyncCompanies: () => void;
}

export function BitrixClientsTab({ clients, isLoading, onSyncContacts, onSyncCompanies }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Clientes do Bitrix24</CardTitle>
            <CardDescription>Contatos e empresas sincronizados</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onSyncContacts}>
              <Users className="h-4 w-4 mr-2" />Sync Contatos
            </Button>
            <Button variant="outline" size="sm" onClick={onSyncCompanies}>
              <Building2 className="h-4 w-4 mr-2" />Sync Empresas
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : clients && clients.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Bitrix</TableHead>
                <TableHead>Razão Social</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Cidade/UF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell><Badge variant="outline" className="font-mono">{cliente.bitrix_id}</Badge></TableCell>
                  <TableCell className="font-medium">{cliente.razao_social}</TableCell>
                  <TableCell>{cliente.email || '-'}</TableCell>
                  <TableCell>{cliente.telefone || '-'}</TableCell>
                  <TableCell>{cliente.cidade ? `${cliente.cidade}${cliente.estado ? `/${cliente.estado}` : ''}` : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum cliente sincronizado ainda</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
