import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate, getStatusLabel } from '@/lib/formatters';
import { Building2, Mail, Phone, MapPin, Wallet, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Fornecedor } from '@/hooks/useFinancialData';

interface FornecedorDetailDialogProps {
  fornecedor: Fornecedor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pago': return 'bg-success/10 text-success border-success/20';
    case 'pendente': return 'bg-warning/10 text-warning border-warning/20';
    case 'vencido': return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'parcial': return 'bg-info/10 text-info border-info/20';
    default: return 'bg-muted text-muted-foreground';
  }
};

export function FornecedorDetailDialog({ fornecedor, open, onOpenChange }: FornecedorDetailDialogProps) {
  const { data: contasPagar, isLoading } = useQuery({
    queryKey: ['contas-pagar-fornecedor', fornecedor?.id],
    queryFn: async () => {
      if (!fornecedor?.id) return [];
      const { data, error } = await supabase
        .from('contas_pagar')
        .select('*')
        .eq('fornecedor_id', fornecedor.id)
        .order('data_vencimento', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!fornecedor?.id && open,
  });

  if (!fornecedor) return null;

  const totalContas = contasPagar?.length || 0;
  const totalValor = contasPagar?.reduce((acc, c) => acc + Number(c.valor), 0) || 0;
  const totalPago = contasPagar?.reduce((acc, c) => acc + Number(c.valor_pago || 0), 0) || 0;
  const contasPagas = contasPagar?.filter(c => c.status === 'pago').length || 0;
  const contasVencidas = contasPagar?.filter(c => c.status === 'vencido').length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {fornecedor.nome_fantasia || fornecedor.razao_social}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Wallet className="h-4 w-4" />
                  Total Contas
                </div>
                <p className="mt-1 font-semibold text-lg">{totalContas}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Pagas
                </div>
                <p className="mt-1 font-semibold text-lg text-success">{contasPagas}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Total Pago
                </div>
                <p className="mt-1 font-semibold text-success">{formatCurrency(totalPago)}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Clock className="h-4 w-4 text-warning" />
                  A Pagar
                </div>
                <p className="mt-1 font-semibold text-warning">{formatCurrency(totalValor - totalPago)}</p>
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
                <span>{fornecedor.email || '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{fornecedor.telefone || '-'}</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{fornecedor.cidade && fornecedor.estado ? `${fornecedor.cidade}/${fornecedor.estado}` : '-'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Contas a Pagar */}
          <Card className="bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>Histórico de Contas a Pagar</span>
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
                ) : contasPagar && contasPagar.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Pago</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contasPagar.map((conta) => (
                        <TableRow key={conta.id}>
                          <TableCell className="font-medium">{conta.descricao}</TableCell>
                          <TableCell>{formatDate(conta.data_vencimento)}</TableCell>
                          <TableCell>{formatCurrency(conta.valor)}</TableCell>
                          <TableCell>{formatCurrency(conta.valor_pago || 0)}</TableCell>
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
