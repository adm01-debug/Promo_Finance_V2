// PANEL: Extrato Financeiro ASAAS

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Loader2, FileText, Search, CheckCircle2, Sparkles } from 'lucide-react';
import { useAsaas } from '@/hooks/useAsaas';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatCurrency } from '@/lib/currency';
import { format, subDays } from 'date-fns';

interface Props {
  empresaId?: string;
}

export function ExtratoAsaasPanel({ empresaId }: Props) {
  const { consultarExtrato, suggestions, aceitarSugestao, gerarSugestoes } = useAsaas(empresaId);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [finishDate, setFinishDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [extrato, setExtrato] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleConsultar = async () => {
    setLoading(true);
    try {
      const result = await consultarExtrato.mutateAsync({ startDate, finishDate });
      setExtrato(result);
    } catch {
      // handled by hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" /> Extrato Financeiro
        </CardTitle>
        <CardDescription>Consulte as movimentações da conta ASAAS</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Data início</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-8 w-40" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Data fim</Label>
            <Input type="date" value={finishDate} onChange={e => setFinishDate(e.target.value)} className="h-8 w-40" />
          </div>
          <Button size="sm" onClick={handleConsultar} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
            Consultar
          </Button>
        </div>

        {extrato?.data && extrato.data.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Conciliação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extrato.data.map((item: any, idx: number) => {
                  const transactionSuggestions = (suggestions || []).filter(s => s.transaction_id === item.id);
                  
                  return (
                    <TableRow key={idx}>
                      <TableCell className="text-sm">{item.date || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{item.type || '-'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{item.description || '-'}</TableCell>
                      <TableCell className={`text-right font-medium ${item.value > 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(item.value || 0)}
                      </TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(item.balance || 0)}</TableCell>
                      <TableCell className="text-right">
                        {item.value > 0 && (
                          <div className="flex justify-end gap-1">
                            {transactionSuggestions.length > 0 ? (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button size="sm" variant="outline" className="h-7 gap-1 bg-primary/5 text-primary border-primary/20 hover:bg-primary/10">
                                    <Sparkles className="h-3 w-3" /> {transactionSuggestions.length} Sugestões
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-2">
                                  <div className="space-y-2">
                                    <h4 className="text-xs font-bold px-2 py-1 uppercase tracking-wider text-muted-foreground">Correspondências Encontradas</h4>
                                    {transactionSuggestions.map(s => (
                                      <div key={s.id} className="p-2 border rounded-md hover:bg-muted/50 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                          <span className="text-xs font-medium truncate max-w-[150px]">{s.contas_receber?.descricao}</span>
                                          <Badge variant="secondary" className="text-[10px]">{Math.round(s.score * 100)}% Match</Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-[10px] text-muted-foreground">{formatCurrency(s.contas_receber?.valor)} • {s.contas_receber?.data_vencimento}</span>
                                          <Button 
                                            size="sm" 
                                            className="h-6 text-[10px] px-2" 
                                            onClick={() => aceitarSugestao.mutate({ suggestionId: s.id, contaId: s.conta_receber_id })}
                                            disabled={aceitarSugestao.isPending}
                                          >
                                            <CheckCircle2 className="h-3 w-3 mr-1" /> Aceitar
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-7 text-xs" 
                                onClick={() => gerarSugestoes.mutate({ date: item.date, value: item.value, transaction_id: item.id })}
                                disabled={gerarSugestoes.isPending}
                              >
                                <Search className="h-3 w-3 mr-1" /> Buscar
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : extrato ? (
          <EmptyState icon={FileText} title="Nenhuma movimentação" description="Não há movimentações no período selecionado" />
        ) : null}
      </CardContent>
    </Card>
  );
}
