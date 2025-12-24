import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ChevronRight, 
  ChevronDown, 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  User, 
  Calendar,
  DollarSign,
  ArrowLeft,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/formatters';

type DrillLevel = 'resumo' | 'categoria' | 'empresa' | 'detalhes';

interface DrillState {
  level: DrillLevel;
  categoria?: 'receitas' | 'despesas';
  empresaId?: string;
  empresaNome?: string;
  mes?: string;
}

export function RelatorioDrillDown() {
  const [periodo, setPeriodo] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [drillState, setDrillState] = useState<DrillState>({ level: 'resumo' });

  const dataInicio = startOfMonth(new Date(periodo + '-01'));
  const dataFim = endOfMonth(dataInicio);

  // Query de resumo geral
  const { data: resumoData, isLoading: isLoadingResumo } = useQuery({
    queryKey: ['drill-resumo', periodo],
    queryFn: async () => {
      const [receitas, despesas] = await Promise.all([
        supabase
          .from('contas_receber')
          .select('valor, valor_recebido, status')
          .gte('data_vencimento', format(dataInicio, 'yyyy-MM-dd'))
          .lte('data_vencimento', format(dataFim, 'yyyy-MM-dd')),
        supabase
          .from('contas_pagar')
          .select('valor, valor_pago, status')
          .gte('data_vencimento', format(dataInicio, 'yyyy-MM-dd'))
          .lte('data_vencimento', format(dataFim, 'yyyy-MM-dd')),
      ]);

      const totalReceitas = receitas.data?.reduce((acc, r) => acc + r.valor, 0) || 0;
      const receitasRecebidas = receitas.data?.filter(r => r.status === 'pago').reduce((acc, r) => acc + (r.valor_recebido || r.valor), 0) || 0;
      
      const totalDespesas = despesas.data?.reduce((acc, d) => acc + d.valor, 0) || 0;
      const despesasPagas = despesas.data?.filter(d => d.status === 'pago').reduce((acc, d) => acc + (d.valor_pago || d.valor), 0) || 0;

      return {
        receitas: {
          total: totalReceitas,
          realizado: receitasRecebidas,
          pendente: totalReceitas - receitasRecebidas,
          percentual: totalReceitas > 0 ? (receitasRecebidas / totalReceitas) * 100 : 0,
          count: receitas.data?.length || 0,
        },
        despesas: {
          total: totalDespesas,
          realizado: despesasPagas,
          pendente: totalDespesas - despesasPagas,
          percentual: totalDespesas > 0 ? (despesasPagas / totalDespesas) * 100 : 0,
          count: despesas.data?.length || 0,
        },
        saldo: receitasRecebidas - despesasPagas,
      };
    },
  });

  // Query por empresa
  const { data: empresasData, isLoading: isLoadingEmpresas } = useQuery({
    queryKey: ['drill-empresas', periodo, drillState.categoria],
    queryFn: async () => {
      const tabela = drillState.categoria === 'receitas' ? 'contas_receber' : 'contas_pagar';
      
      const { data: empresas } = await supabase
        .from('empresas')
        .select('id, razao_social, nome_fantasia');

      const { data: contas, error } = await supabase
        .from(tabela)
        .select('*')
        .gte('data_vencimento', format(dataInicio, 'yyyy-MM-dd'))
        .lte('data_vencimento', format(dataFim, 'yyyy-MM-dd'));

      if (error || !contas) return [];

      const porEmpresa = empresas?.map(emp => {
        const contasEmpresa = contas.filter((c: any) => c.empresa_id === emp.id);
        const total = contasEmpresa.reduce((acc: number, c: any) => acc + (c.valor || 0), 0);
        const valorField = drillState.categoria === 'receitas' ? 'valor_recebido' : 'valor_pago';
        const realizado = contasEmpresa
          .filter((c: any) => c.status === 'pago')
          .reduce((acc: number, c: any) => acc + (c[valorField] || c.valor || 0), 0);

        return {
          id: emp.id,
          nome: emp.nome_fantasia || emp.razao_social,
          total,
          realizado,
          pendente: total - realizado,
          count: contasEmpresa.length,
          percentual: total > 0 ? (realizado / total) * 100 : 0,
        };
      }).filter(e => e.total > 0);

      return porEmpresa?.sort((a, b) => b.total - a.total) || [];
    },
    enabled: drillState.level === 'empresa',
  });

  // Query detalhada por empresa
  const { data: detalhesData, isLoading: isLoadingDetalhes } = useQuery({
    queryKey: ['drill-detalhes', periodo, drillState.categoria, drillState.empresaId],
    queryFn: async () => {
      const tabela = drillState.categoria === 'receitas' ? 'contas_receber' : 'contas_pagar';
      const nomeField = drillState.categoria === 'receitas' ? 'cliente_nome' : 'fornecedor_nome';
      
      const { data } = await supabase
        .from(tabela)
        .select('*')
        .eq('empresa_id', drillState.empresaId!)
        .gte('data_vencimento', format(dataInicio, 'yyyy-MM-dd'))
        .lte('data_vencimento', format(dataFim, 'yyyy-MM-dd'))
        .order('data_vencimento');

      return data?.map(item => ({
        id: item.id,
        descricao: item.descricao,
        entidade: (item as any)[nomeField],
        valor: item.valor,
        vencimento: item.data_vencimento,
        status: item.status,
      })) || [];
    },
    enabled: drillState.level === 'detalhes' && !!drillState.empresaId,
  });

  const handleDrill = (newState: Partial<DrillState>) => {
    setDrillState(prev => ({ ...prev, ...newState }));
  };

  const handleBack = () => {
    if (drillState.level === 'detalhes') {
      setDrillState(prev => ({ ...prev, level: 'empresa', empresaId: undefined }));
    } else if (drillState.level === 'empresa') {
      setDrillState(prev => ({ ...prev, level: 'resumo', categoria: undefined }));
    }
  };

  // Gerar opções de período (últimos 12 meses)
  const periodoOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy', { locale: ptBR }),
    };
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {drillState.level !== 'resumo' && (
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <CardTitle>Análise Detalhada</CardTitle>
              <CardDescription>
                {drillState.level === 'resumo' && 'Clique em uma categoria para ver detalhes'}
                {drillState.level === 'empresa' && `${drillState.categoria === 'receitas' ? 'Receitas' : 'Despesas'} por empresa`}
                {drillState.level === 'detalhes' && `Detalhes - ${drillState.empresaNome}`}
              </CardDescription>
            </div>
          </div>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodoOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {/* Nível 1: Resumo */}
          {drillState.level === 'resumo' && (
            <motion.div
              key="resumo"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {isLoadingResumo ? (
                <>
                  <Skeleton className="h-48" />
                  <Skeleton className="h-48" />
                </>
              ) : (
                <>
                  {/* Card Receitas */}
                  <Card 
                    className="cursor-pointer hover:border-green-500 transition-colors group"
                    onClick={() => handleDrill({ level: 'empresa', categoria: 'receitas' })}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-green-500" />
                          <span className="font-semibold">Receitas</span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-green-500 transition-colors" />
                      </div>
                      <div className="space-y-3">
                        <div className="text-3xl font-bold text-green-600">
                          {formatCurrency(resumoData?.receitas.total || 0)}
                        </div>
                        <Progress value={resumoData?.receitas.percentual || 0} className="h-2" />
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Recebido: {formatCurrency(resumoData?.receitas.realizado || 0)}
                          </span>
                          <span className="text-muted-foreground">
                            {resumoData?.receitas.count} lançamentos
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card Despesas */}
                  <Card 
                    className="cursor-pointer hover:border-red-500 transition-colors group"
                    onClick={() => handleDrill({ level: 'empresa', categoria: 'despesas' })}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-5 w-5 text-red-500" />
                          <span className="font-semibold">Despesas</span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-red-500 transition-colors" />
                      </div>
                      <div className="space-y-3">
                        <div className="text-3xl font-bold text-red-600">
                          {formatCurrency(resumoData?.despesas.total || 0)}
                        </div>
                        <Progress value={resumoData?.despesas.percentual || 0} className="h-2" />
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Pago: {formatCurrency(resumoData?.despesas.realizado || 0)}
                          </span>
                          <span className="text-muted-foreground">
                            {resumoData?.despesas.count} lançamentos
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </motion.div>
          )}

          {/* Nível 2: Por Empresa */}
          {drillState.level === 'empresa' && (
            <motion.div
              key="empresa"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {isLoadingEmpresas ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {empresasData?.map((empresa, index) => (
                    <motion.div
                      key={empresa.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card 
                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => handleDrill({ 
                          level: 'detalhes', 
                          empresaId: empresa.id,
                          empresaNome: empresa.nome,
                        })}
                      >
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{empresa.nome}</p>
                                <p className="text-sm text-muted-foreground">
                                  {empresa.count} lançamentos
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-bold">{formatCurrency(empresa.total)}</p>
                                <p className="text-sm text-muted-foreground">
                                  {empresa.percentual.toFixed(0)}% realizado
                                </p>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Nível 3: Detalhes */}
          {drillState.level === 'detalhes' && (
            <motion.div
              key="detalhes"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {isLoadingDetalhes ? (
                <Skeleton className="h-64" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>{drillState.categoria === 'receitas' ? 'Cliente' : 'Fornecedor'}</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detalhesData?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.descricao}</TableCell>
                        <TableCell>{item.entidade}</TableCell>
                        <TableCell>{format(new Date(item.vencimento), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                          <Badge variant={
                            item.status === 'pago' ? 'default' :
                            item.status === 'vencido' ? 'destructive' : 'secondary'
                          }>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.valor)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
