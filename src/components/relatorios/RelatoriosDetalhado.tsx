import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface Transacao {
  id: string;
  data: string;
  descricao: string;
  categoria: string;
  tipo: string;
  valor: number;
  status: string;
}

interface RelatoriosDetalhadoProps {
  transacoes: Transacao[];
  isLoading?: boolean;
}

export function RelatoriosDetalhado({ transacoes, isLoading }: RelatoriosDetalhadoProps) {
  const [filter, setFilter] = useState('');

  const filteredTransacoes = (transacoes || []).filter(t => 
    t.descricao?.toLowerCase().includes(filter.toLowerCase()) ||
    t.categoria?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Card className="border-none bg-background/40 backdrop-blur-xl shadow-2xl rounded-[2rem] overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <div>
          <CardTitle className="text-2xl font-black tracking-tight">Relatório Detalhado</CardTitle>
          <CardDescription className="font-medium opacity-60">Transações granulares do período selecionado</CardDescription>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Pesquisar descrição ou categoria..." 
            className="pl-9 bg-background/50 border-white/10 rounded-xl"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-bold text-muted-foreground animate-pulse">PROCESSANDO DADOS REAIS...</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="w-12"><Checkbox className="border-white/20" /></TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest opacity-70">Data</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest opacity-70">Descrição</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest opacity-70">Categoria</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest opacity-70">Tipo</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-widest opacity-70">Valor</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-widest opacity-70">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransacoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground font-medium italic">
                      Nenhuma transação encontrada no período.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransacoes.map((item) => (
                    <TableRow key={item.id} className="hover:bg-card/5 transition-colors border-white/5">
                      <TableCell><Checkbox className="border-white/20" /></TableCell>
                      <TableCell className="font-medium text-muted-foreground">{new Date(item.data).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="font-bold">{item.descricao}</TableCell>
                      <TableCell><Badge variant="outline" className="border-white/10 bg-card/5">{item.categoria}</Badge></TableCell>
                      <TableCell>
                        <Badge 
                          variant={item.tipo === 'Receita' ? 'default' : 'secondary'} 
                          className={cn("font-black", item.tipo === 'Receita' ? 'bg-success/20 text-success border-success/30' : 'bg-destructive/20 text-destructive border-destructive/30')}
                        >
                          {item.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn("text-right font-black", item.tipo === 'Receita' ? "text-success" : "text-destructive")}>
                        {item.tipo === 'Receita' ? '+' : '-'}{formatCurrency(item.valor)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={item.status === 'Conciliado' ? 'default' : 'outline'}
                          className={cn(item.status === 'Conciliado' ? 'bg-primary/20 text-primary border-primary/30' : 'border-white/10 opacity-50')}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
