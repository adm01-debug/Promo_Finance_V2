import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, RefreshCw, Download } from 'lucide-react';
import { useAsaas } from '@/hooks/useAsaas';
import { formatCurrency } from '@/lib/currency';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  empresaId?: string;
}

interface TransferenciaPixItem {
  id: string;
  created_at: string;
  chave_pix?: string | null;
  tipo_chave?: string | null;
  valor: number;
  status: string;
  asaas_id: string;
  transaction_receipt_url?: string | null;
}

export function TransferenciaPixHistoryPanel({ empresaId }: Props) {
  const { transfers, loadingTransfers, sincronizarTransferencia } = useAsaas(empresaId);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  const filteredTransfers = (transfers || []).filter(t => {
    const matchesSearch = !searchTerm || t.chave_pix.includes(searchTerm) || t.asaas_id?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    
    let matchesDate = true;
    if (dateStart && t.created_at < dateStart) matchesDate = false;
    if (dateEnd && t.created_at > dateEnd + 'T23:59:59') matchesDate = false;

    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DONE':
      case 'CONFIRMED': return <Badge className="bg-success">Concluído</Badge>;
      case 'FAILED': return <Badge variant="destructive">Falhou</Badge>;
      case 'PENDING': return <Badge variant="secondary">Pendente</Badge>;
      case 'PROCESSING': return <Badge className="bg-warning">Em Processamento</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por chave ou ID..." 
            className="pl-9" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="DONE">Concluídos</SelectItem>
            <SelectItem value="PENDING">Pendentes</SelectItem>
            <SelectItem value="PROCESSING">Processando</SelectItem>
            <SelectItem value="FAILED">Falhados</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2 w-full md:w-auto">
          <Input 
            type="date" 
            className="flex-1 md:w-[150px]" 
            value={dateStart}
            onChange={e => setDateStart(e.target.value)}
          />
          <Input 
            type="date" 
            className="flex-1 md:w-[150px]" 
            value={dateEnd}
            onChange={e => setDateEnd(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Cashout Pix</CardTitle>
          <CardDescription>Visualização de todas as transferências realizadas via Asaas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Chave Pix</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingTransfers ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : filteredTransfers.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma transferência encontrada</TableCell></TableRow>
              ) : (filteredTransfers as unknown as TransferenciaPixItem[]).map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-xs">
                    {format(parseISO(item.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{item.chave_pix}</span>
                      <span className="text-[10px] text-muted-foreground">{item.tipo_chave}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">{formatCurrency(item.valor)}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => sincronizarTransferencia.mutate(item.asaas_id)}
                        disabled={sincronizarTransferencia.isPending}
                        title="Sincronizar Status"
                      >
                        <RefreshCw className={`h-4 w-4 ${sincronizarTransferencia.isPending ? 'animate-spin' : ''}`} />
                      </Button>
                      {item.transaction_receipt_url && (
                        <Button size="icon" variant="ghost" asChild title="Comprovante">
                          <a href={item.transaction_receipt_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
