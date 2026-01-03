// ============================================
// GESTOR DE CRÉDITOS TRIBUTÁRIOS
// Controle de créditos IBS/CBS
// ============================================

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  TrendingDown, 
  Receipt,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  Filter,
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
import useReformaTributaria from '@/hooks/useReformaTributaria';
import { formatCurrency } from '@/lib/formatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--muted-foreground))'];

// Dados de exemplo para créditos
const creditosExemplo = [
  {
    id: '1',
    tipo: 'CBS' as const,
    valor: 15000,
    valorUtilizado: 8000,
    dataOrigem: new Date('2025-12-15'),
    documentoOrigem: 'NF-e 001234',
    fornecedor: 'Fornecedor ABC Ltda',
    status: 'disponivel' as const,
  },
  {
    id: '2',
    tipo: 'IBS' as const,
    valor: 25000,
    valorUtilizado: 25000,
    dataOrigem: new Date('2025-12-10'),
    documentoOrigem: 'NF-e 001230',
    fornecedor: 'Indústria XYZ S/A',
    status: 'utilizado' as const,
  },
  {
    id: '3',
    tipo: 'CBS' as const,
    valor: 12500,
    valorUtilizado: 0,
    dataOrigem: new Date('2025-12-20'),
    documentoOrigem: 'NF-e 001240',
    fornecedor: 'Distribuidora 123',
    status: 'disponivel' as const,
  },
  {
    id: '4',
    tipo: 'IBS' as const,
    valor: 18000,
    valorUtilizado: 5000,
    dataOrigem: new Date('2025-12-18'),
    documentoOrigem: 'CT-e 005678',
    fornecedor: 'Transportadora Express',
    status: 'disponivel' as const,
  },
  {
    id: '5',
    tipo: 'CBS' as const,
    valor: 8500,
    valorUtilizado: 0,
    dataOrigem: new Date('2025-11-28'),
    documentoOrigem: 'NFS-e 009876',
    fornecedor: 'Consultoria Digital',
    status: 'disponivel' as const,
  },
];

export function GestorCreditosTributarios() {
  const { metricas, anoReferencia, aliquotasAtuais } = useReformaTributaria();
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'CBS' | 'IBS'>('todos');

  // Resumo dos créditos
  const resumoCreditos = useMemo(() => {
    const cbsTotal = creditosExemplo.filter(c => c.tipo === 'CBS').reduce((acc, c) => acc + c.valor, 0);
    const cbsUtilizado = creditosExemplo.filter(c => c.tipo === 'CBS').reduce((acc, c) => acc + c.valorUtilizado, 0);
    const ibsTotal = creditosExemplo.filter(c => c.tipo === 'IBS').reduce((acc, c) => acc + c.valor, 0);
    const ibsUtilizado = creditosExemplo.filter(c => c.tipo === 'IBS').reduce((acc, c) => acc + c.valorUtilizado, 0);
    
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
  }, []);

  // Dados para gráfico de pizza
  const dadosDistribuicao = [
    { name: 'CBS Disponível', value: resumoCreditos.cbsDisponivel },
    { name: 'IBS Disponível', value: resumoCreditos.ibsDisponivel },
    { name: 'Utilizados', value: resumoCreditos.totalUtilizado },
  ];

  // Dados para gráfico de barras mensal
  const dadosMensal = [
    { mes: 'Out', cbsCreditos: 28000, ibsCreditos: 35000, cbsDebitos: 25000, ibsDebitos: 30000 },
    { mes: 'Nov', cbsCreditos: 32000, ibsCreditos: 40000, cbsDebitos: 28000, ibsDebitos: 35000 },
    { mes: 'Dez', cbsCreditos: 36000, ibsCreditos: 43000, cbsDebitos: 30000, ibsDebitos: 38000 },
  ];

  // Filtrar créditos
  const creditosFiltrados = filtroTipo === 'todos' 
    ? creditosExemplo 
    : creditosExemplo.filter(c => c.tipo === filtroTipo);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'disponivel':
        return <Badge variant="default" className="bg-green-500">Disponível</Badge>;
      case 'utilizado':
        return <Badge variant="secondary">Utilizado</Badge>;
      case 'expirado':
        return <Badge variant="destructive">Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
            <div className="text-2xl font-bold">{formatCurrency(resumoCreditos.total)}</div>
            <p className="text-xs text-muted-foreground">
              Acumulado no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Disponíveis</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(resumoCreditos.totalDisponivel)}
            </div>
            <Progress 
              value={(resumoCreditos.totalDisponivel / resumoCreditos.total) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">CBS Disponível</CardTitle>
            <Receipt className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(resumoCreditos.cbsDisponivel)}
            </div>
            <p className="text-xs text-muted-foreground">
              {((resumoCreditos.cbsUtilizado / resumoCreditos.cbsTotal) * 100).toFixed(0)}% utilizado
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">IBS Disponível</CardTitle>
            <Receipt className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(resumoCreditos.ibsDisponivel)}
            </div>
            <p className="text-xs text-muted-foreground">
              {((resumoCreditos.ibsUtilizado / resumoCreditos.ibsTotal) * 100).toFixed(0)}% utilizado
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Créditos vs Débitos Mensais</CardTitle>
            <CardDescription>Últimos 3 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dadosMensal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="cbsCreditos" name="CBS Créditos" fill="hsl(var(--primary))" />
                <Bar dataKey="ibsCreditos" name="IBS Créditos" fill="hsl(210 100% 45%)" />
              </BarChart>
            </ResponsiveContainer>
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
                    <Badge variant={credito.tipo === 'CBS' ? 'default' : 'secondary'}>
                      {credito.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{credito.documentoOrigem}</TableCell>
                  <TableCell>{credito.fornecedor}</TableCell>
                  <TableCell>
                    {format(credito.dataOrigem, 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(credito.valor)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(credito.valorUtilizado)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    {formatCurrency(credito.valor - credito.valorUtilizado)}
                  </TableCell>
                  <TableCell>{getStatusBadge(credito.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
