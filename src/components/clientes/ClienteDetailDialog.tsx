import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate, getStatusLabel } from '@/lib/formatters';
import { Building2, Mail, Phone, MapPin, CreditCard, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ExternalCliente } from '@/hooks/useFinancialData';

interface ClienteDetailDialogProps {
  cliente: ExternalCliente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getScoreColor = (score: number | null) => {
  if (!score) return 'bg-muted text-muted-foreground';
  if (score >= 80) return 'bg-success/10 text-success';
  if (score >= 60) return 'bg-warning/10 text-warning';
  return 'bg-destructive/10 text-destructive';
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pago': return 'bg-success/10 text-success border-success/20';
    case 'pendente': return 'bg-warning/10 text-warning border-warning/20';
    case 'vencido': return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'parcial': return 'bg-info/10 text-info border-info/20';
    default: return 'bg-muted text-muted-foreground';
  }
};

export function ClienteDetailDialog({ cliente, open, onOpenChange }: ClienteDetailDialogProps) {
  const { data: contasReceber, isLoading } = useQuery({
    queryKey: ['contas-receber-cliente', cliente?.id],
    queryFn: async () => {
      if (!cliente?.id) return [];
      const { data, error } = await supabase
        .from('contas_receber')
        .select('*')
        .eq('cliente_id', cliente.id)
        .order('data_vencimento', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!cliente?.id && open,
  });

  if (!cliente) return null;

  const totalContas = contasReceber?.length || 0;
  const totalValor = contasReceber?.reduce((acc, c) => acc + Number(c.valor), 0) || 0;
  const totalRecebido = contasReceber?.reduce((acc, c) => acc + Number(c.valor_recebido || 0), 0) || 0;
  const contasPagas = contasReceber?.filter(c => c.status === 'pago').length || 0;
  const contasVencidas = contasReceber?.filter(c => c.status === 'vencido').length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {cliente.nome_fantasia || cliente.razao_social}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <TrendingUp className="h-4 w-4" />
                  Score
                </div>
                <div className="mt-1">
                  <Badge className={getScoreColor(cliente.score)}>
                    {cliente.score || 'N/A'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <CreditCard className="h-4 w-4" />
                  Limite
                </div>
                <p className="mt-1 font-semibold">{formatCurrency(cliente.limite_credito || 0)}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Recebido
                </div>
                <p className="mt-1 font-semibold text-success">{formatCurrency(totalRecebido)}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Clock className="h-4 w-4 text-warning" />
                  A Receber
                </div>
                <p className="mt-1 font-semibold text-warning">{formatCurrency(totalValor - totalRecebido)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Info */}
          <Card className="bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{cliente.email || '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{cliente.telefone || '-'}</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{cliente.cidade && cliente.estado ? `${cliente.cidade}/${cliente.estado}` : '-'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Contas a Receber */}
          <Card className="bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>Histórico de Contas a Receber</span>
                <div className="flex gap-2">
                  <Badge variant="outline">{totalContas} contas</Badge>
                  {contasVencidas > 0 && (
                    <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {contasVencidas} vencidas
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[250px]">
                {isLoading ? (
                  <div className="p-4 text-center text-muted-foreground">Carregando...</div>
                ) : contasReceber && contasReceber.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Recebido</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contasReceber.map((conta) => (
                        <TableRow key={conta.id}>
                          <TableCell className="font-medium">{conta.descricao}</TableCell>
                          <TableCell>{formatDate(conta.data_vencimento)}</TableCell>
                          <TableCell>{formatCurrency(conta.valor)}</TableCell>
                          <TableCell>{formatCurrency(conta.valor_recebido || 0)}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(conta.status)}>
                              {getStatusLabel(conta.status)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    Nenhuma conta encontrada
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
