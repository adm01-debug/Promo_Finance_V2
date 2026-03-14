// ============================================
// GESTOR DE CRÉDITOS TRIBUTÁRIOS
// Controle de créditos IBS/CBS com dados reais
// ============================================

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  DollarSign, 
  TrendingUp, 
  Receipt,
  CheckCircle2,
  Download,
  Plus,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useCreditosTributarios } from '@/hooks/useCreditosTributarios';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import { formatCurrency } from '@/lib/formatters';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--muted-foreground))'];

export function GestorCreditosTributarios() {
  const { data: empresas } = useAllEmpresas();
  const empresaId = empresas?.[0]?.id;
  
  const { 
    creditos, 
    resumoCreditos, 
    isLoading, 
    criarCredito,
    gerarCreditosNFe 
  } = useCreditosTributarios(empresaId);
  
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'CBS' | 'IBS'>('todos');

  // Resumo calculado dos créditos reais
  const resumo = useMemo(() => {
    if (!creditos || creditos.length === 0) {
      return {
        cbsTotal: 0,
        cbsUtilizado: 0,
        cbsDisponivel: 0,
        ibsTotal: 0,
        ibsUtilizado: 0,
        ibsDisponivel: 0,
        total: 0,
        totalUtilizado: 0,
        totalDisponivel: 0,
      };
    }

    const cbsCreditos = creditos.filter(c => c.tipo_tributo === 'CBS');
    const ibsCreditos = creditos.filter(c => c.tipo_tributo === 'IBS');

    const cbsTotal = cbsCreditos.reduce((acc, c) => acc + Number(c.valor_credito), 0);
    const cbsUtilizado = cbsCreditos.reduce((acc, c) => acc + Number(c.valor_utilizado), 0);
    const ibsTotal = ibsCreditos.reduce((acc, c) => acc + Number(c.valor_credito), 0);
    const ibsUtilizado = ibsCreditos.reduce((acc, c) => acc + Number(c.valor_utilizado), 0);

    return {
      cbsTotal,
      cbsUtilizado,
      cbsDisponivel: cbsTotal - cbsUtilizado,
      ibsTotal,
      ibsUtilizado,
      ibsDisponivel: ibsTotal - ibsUtilizado,
      total: cbsTotal + ibsTotal,
      totalUtilizado: cbsUtilizado + ibsUtilizado,
      totalDisponivel: (cbsTotal - cbsUtilizado) + (ibsTotal - ibsUtilizado),
    };
  }, [creditos]);

  // Dados para gráfico de pizza
  const dadosDistribuicao = useMemo(() => [
    { name: 'CBS Disponível', value: resumo.cbsDisponivel },
    { name: 'IBS Disponível', value: resumo.ibsDisponivel },
    { name: 'Utilizados', value: resumo.totalUtilizado },
  ], [resumo]);

  // Dados para gráfico de barras mensal (agrupa créditos por mês)
  const dadosMensal = useMemo(() => {
    if (!creditos || creditos.length === 0) return [];
    
    const porMes: Record<string, { mes: string; cbsCreditos: number; ibsCreditos: number }> = {};
    
    creditos.forEach(c => {
      const mes = format(parseISO(c.data_origem), 'MMM', { locale: ptBR });
      if (!porMes[mes]) {
        porMes[mes] = { mes, cbsCreditos: 0, ibsCreditos: 0 };
      }
      if (c.tipo_tributo === 'CBS') {
        porMes[mes].cbsCreditos += Number(c.valor_credito);
      } else {
        porMes[mes].ibsCreditos += Number(c.valor_credito);
      }
    });
    
    return Object.values(porMes).slice(-6);
  }, [creditos]);

  // Filtrar créditos
  const creditosFiltrados = useMemo(() => {
    if (!creditos) return [];
    return filtroTipo === 'todos' 
      ? creditos 
      : creditos.filter(c => c.tipo_tributo === filtroTipo);
  }, [creditos, filtroTipo]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'disponivel':
        return <Badge variant="default" className="bg-success">Disponível</Badge>;
      case 'utilizado':
        return <Badge variant="secondary">Utilizado</Badge>;
      case 'expirado':
        return <Badge variant="destructive">Expirado</Badge>;
      case 'estornado':
        return <Badge variant="outline" className="border-warning text-warning">Estornado</Badge>;
      case 'compensado':
        return <Badge variant="outline" className="border-primary text-primary">Compensado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Créditos Totais</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(resumo.total)}</div>
            <p className="text-xs text-muted-foreground">
              {creditos?.length || 0} créditos registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Disponíveis</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(resumo.totalDisponivel)}
            </div>
            <Progress 
              value={resumo.total > 0 ? (resumo.totalDisponivel / resumo.total) * 100 : 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">CBS Disponível</CardTitle>
            <Receipt className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(resumo.cbsDisponivel)}
            </div>
            <p className="text-xs text-muted-foreground">
              {resumo.cbsTotal > 0 ? ((resumo.cbsUtilizado / resumo.cbsTotal) * 100).toFixed(0) : 0}% utilizado
            </p>
          </CardContent>
        </Card>

        <Card className="border-success/20 bg-success/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">IBS Disponível</CardTitle>
            <Receipt className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(resumo.ibsDisponivel)}
            </div>
            <p className="text-xs text-muted-foreground">
              {resumo.ibsTotal > 0 ? ((resumo.ibsUtilizado / resumo.ibsTotal) * 100).toFixed(0) : 0}% utilizado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Créditos</CardTitle>
            <CardDescription>CBS, IBS e utilizados</CardDescription>
          </CardHeader>
          <CardContent>
            {resumo.total > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={dadosDistribuicao}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {dadosDistribuicao.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
                <AlertCircle className="h-12 w-12 mb-2" />
                <p>Nenhum crédito registrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Créditos por Mês</CardTitle>
            <CardDescription>Evolução dos créditos CBS/IBS</CardDescription>
          </CardHeader>
          <CardContent>
            {dadosMensal.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dadosMensal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="cbsCreditos" name="CBS" fill="hsl(var(--primary))" />
                  <Bar dataKey="ibsCreditos" name="IBS" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
                <AlertCircle className="h-12 w-12 mb-2" />
                <p>Dados insuficientes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Créditos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Créditos Detalhados</CardTitle>
              <CardDescription>Lista de créditos por documento</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Tabs value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as typeof filtroTipo)}>
                <TabsList>
                  <TabsTrigger value="todos">Todos</TabsTrigger>
                  <TabsTrigger value="CBS">CBS</TabsTrigger>
                  <TabsTrigger value="IBS">IBS</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {creditosFiltrados.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead className="text-right">Utilizado</TableHead>
                  <TableHead className="text-right">Disponível</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditosFiltrados.map((credito) => (
                  <TableRow key={credito.id}>
                    <TableCell>
                      <Badge variant={credito.tipo_tributo === 'CBS' ? 'default' : 'secondary'}>
                        {credito.tipo_tributo}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {credito.documento_tipo?.toUpperCase()} {credito.documento_numero}
                    </TableCell>
                    <TableCell>{credito.fornecedor_nome || '-'}</TableCell>
                    <TableCell>
                      {format(parseISO(credito.data_origem), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(credito.valor_credito)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(credito.valor_utilizado)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-success">
                      {formatCurrency(Number(credito.valor_credito) - Number(credito.valor_utilizado))}
                    </TableCell>
                    <TableCell>{getStatusBadge(credito.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Receipt className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhum crédito encontrado</p>
              <p className="text-sm mb-4">Os créditos serão gerados automaticamente a partir das NF-e de compra</p>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Registrar Crédito Manual
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações sobre Não-Cumulatividade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Não-Cumulatividade Plena
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Crédito Integral</h4>
              <p className="text-sm text-muted-foreground">
                Todo IBS e CBS pago nas aquisições gera crédito, sem restrições por tipo de bem ou serviço.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Compensação Cruzada</h4>
              <p className="text-sm text-muted-foreground">
                Créditos de CBS compensam débitos de CBS. Créditos de IBS compensam débitos de IBS.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Ressarcimento</h4>
              <p className="text-sm text-muted-foreground">
                Saldo credor acumulado pode ser ressarcido em até 60 dias, conforme regulamentação.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default GestorCreditosTributarios;
