import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { getEventos, getEstatisticas, EventoSefaz } from '@/lib/sefaz-event-logger';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// Cores do tema
const COLORS = {
  success: 'hsl(var(--chart-2))',
  error: 'hsl(var(--chart-1))',
  warning: 'hsl(var(--chart-4))',
  info: 'hsl(var(--chart-3))',
  primary: 'hsl(var(--primary))',
  muted: 'hsl(var(--muted-foreground))'
};

const PIE_COLORS = ['hsl(160, 84%, 39%)', 'hsl(0, 84%, 60%)', 'hsl(38, 92%, 50%)', 'hsl(239, 84%, 67%)', 'hsl(258, 90%, 66%)'];

type Periodo = '24h' | '7d' | '30d' | '90d';

export const SefazAnalytics = () => {
  const [periodo, setPeriodo] = useState<Periodo>('7d');
  const [activeTab, setActiveTab] = useState('visao-geral');

  // Filtra eventos por período
  const eventosFiltrados = useMemo(() => {
    const eventos = getEventos();
    const agora = new Date();
    let limite: Date;

    switch (periodo) {
      case '24h':
        limite = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        limite = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        limite = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        limite = new Date(agora.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
    }

    return eventos.filter(e => e.timestamp >= limite);
  }, [periodo]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const total = eventosFiltrados.length;
    const autorizadas = eventosFiltrados.filter(e => e.tipo === 'AUTORIZACAO').length;
    const rejeitadas = eventosFiltrados.filter(e => e.tipo === 'REJEICAO').length;
    const cancelamentos = eventosFiltrados.filter(e => e.tipo === 'CANCELAMENTO').length;
    const erros = eventosFiltrados.filter(e => e.tipo === 'ERRO_CONEXAO' || e.tipo === 'TIMEOUT').length;

    const tempos = eventosFiltrados
      .filter(e => e.tempoResposta !== undefined)
      .map(e => e.tempoResposta!);
    
    const tempoMedio = tempos.length > 0 
      ? tempos.reduce((a, b) => a + b, 0) / tempos.length 
      : 0;

    const taxaSucesso = total > 0 ? (autorizadas / total) * 100 : 0;
    const taxaRejeicao = total > 0 ? (rejeitadas / total) * 100 : 0;

    return {
      total,
      autorizadas,
      rejeitadas,
      cancelamentos,
      erros,
      tempoMedio,
      taxaSucesso,
      taxaRejeicao
    };
  }, [eventosFiltrados]);

  // Dados para gráfico de linha temporal
  const dadosTemporais = useMemo(() => {
    const grupos = new Map<string, { autorizadas: number; rejeitadas: number; total: number }>();
    
    eventosFiltrados.forEach(evento => {
      let chave: string;
      
      if (periodo === '24h') {
        chave = evento.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      } else {
        chave = evento.timestamp.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      }

      if (!grupos.has(chave)) {
        grupos.set(chave, { autorizadas: 0, rejeitadas: 0, total: 0 });
      }

      const grupo = grupos.get(chave)!;
      grupo.total++;
      
      if (evento.tipo === 'AUTORIZACAO') {
        grupo.autorizadas++;
      } else if (evento.tipo === 'REJEICAO') {
        grupo.rejeitadas++;
      }
    });

    return Array.from(grupos.entries())
      .map(([periodo, dados]) => ({
        periodo,
        ...dados,
        taxa: dados.total > 0 ? ((dados.autorizadas / dados.total) * 100).toFixed(1) : 0
      }))
      .reverse();
  }, [eventosFiltrados, periodo]);

  // Dados para gráfico de pizza por tipo
  const dadosPorTipo = useMemo(() => {
    const tipos = new Map<string, number>();
    
    eventosFiltrados.forEach(evento => {
      tipos.set(evento.tipo, (tipos.get(evento.tipo) || 0) + 1);
    });

    const labels: Record<string, string> = {
      'AUTORIZACAO': 'Autorizadas',
      'REJEICAO': 'Rejeitadas',
      'CANCELAMENTO': 'Cancelamentos',
      'ENVIO_LOTE': 'Envios',
      'CONSULTA': 'Consultas',
      'ERRO_CONEXAO': 'Erros',
      'TIMEOUT': 'Timeouts',
      'VALIDACAO': 'Validações'
    };

    return Array.from(tipos.entries())
      .map(([tipo, valor]) => ({
        name: labels[tipo] || tipo,
        value: valor
      }))
      .sort((a, b) => b.value - a.value);
  }, [eventosFiltrados]);

  // Dados para gráfico de códigos de rejeição
  const codigosRejeicao = useMemo(() => {
    const codigos = new Map<string, { count: number; motivo: string }>();
    
    eventosFiltrados
      .filter(e => e.tipo === 'REJEICAO')
      .forEach(evento => {
        if (!codigos.has(evento.cStat)) {
          codigos.set(evento.cStat, { count: 0, motivo: evento.xMotivo });
        }
        codigos.get(evento.cStat)!.count++;
      });

    return Array.from(codigos.entries())
      .map(([codigo, dados]) => ({
        codigo,
        quantidade: dados.count,
        motivo: dados.motivo.length > 30 ? dados.motivo.slice(0, 30) + '...' : dados.motivo
      }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);
  }, [eventosFiltrados]);

  // Dados de tempo de resposta por hora
  const temposPorHora = useMemo(() => {
    const horas = new Map<number, number[]>();
    
    eventosFiltrados
      .filter(e => e.tempoResposta !== undefined)
      .forEach(evento => {
        const hora = evento.timestamp.getHours();
        if (!horas.has(hora)) {
          horas.set(hora, []);
        }
        horas.get(hora)!.push(evento.tempoResposta!);
      });

    return Array.from(horas.entries())
      .map(([hora, tempos]) => ({
        hora: `${hora.toString().padStart(2, '0')}h`,
        tempoMedio: Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length),
        quantidade: tempos.length
      }))
      .sort((a, b) => parseInt(a.hora) - parseInt(b.hora));
  }, [eventosFiltrados]);

  interface TooltipPayloadEntry {
    name: string;
    value: number;
    color: string;
  }

  interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadEntry[];
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm mb-1">{label}</p>
          {payload.map((entry: TooltipPayloadEntry, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Analytics SEFAZ</h3>
          <p className="text-sm text-muted-foreground">
            Monitore o desempenho das comunicações com a SEFAZ
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Últimas 24h</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                  <p className="text-2xl font-bold text-emerald-500">
                    {stats.taxaSucesso.toFixed(1)}%
                  </p>
                </div>
                <div className="p-2 rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span className="text-muted-foreground">{stats.autorizadas} autorizadas</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Rejeição</p>
                  <p className="text-2xl font-bold text-destructive">
                    {stats.taxaRejeicao.toFixed(1)}%
                  </p>
                </div>
                <div className="p-2 rounded-full bg-destructive/10">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs">
                <TrendingDown className="h-3 w-3 text-destructive" />
                <span className="text-muted-foreground">{stats.rejeitadas} rejeitadas</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tempo Médio</p>
                  <p className="text-2xl font-bold">
                    {(stats.tempoMedio / 1000).toFixed(1)}s
                  </p>
                </div>
                <div className="p-2 rounded-full bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs">
                <Zap className="h-3 w-3 text-primary" />
                <span className="text-muted-foreground">resposta SEFAZ</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Eventos</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="p-2 rounded-full bg-blue-500/10">
                  <Activity className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs">
                <span className="text-muted-foreground">
                  {stats.cancelamentos} cancelamentos • {stats.erros} erros
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Gráficos */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="visao-geral" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="distribuicao" className="gap-2">
            <PieChartIcon className="h-4 w-4" />
            Distribuição
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <Activity className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-6">
          {/* Gráfico de área - Taxa de sucesso ao longo do tempo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Autorizações vs Rejeições</CardTitle>
              <CardDescription>Volume de eventos ao longo do período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dadosTemporais}>
                    <defs>
                      <linearGradient id="colorAutorizadas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(150, 70%, 42%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(150, 70%, 42%)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRejeitadas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(0, 78%, 55%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(0, 78%, 55%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="periodo" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="autorizadas"
                      name="Autorizadas"
                      stroke="hsl(150, 70%, 42%)"
                      fillOpacity={1}
                      fill="url(#colorAutorizadas)"
                    />
                    <Area
                      type="monotone"
                      dataKey="rejeitadas"
                      name="Rejeitadas"
                      stroke="hsl(0, 78%, 55%)"
                      fillOpacity={1}
                      fill="url(#colorRejeitadas)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Principais códigos de rejeição */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Principais Códigos de Rejeição</CardTitle>
              <CardDescription>Erros mais frequentes da SEFAZ</CardDescription>
            </CardHeader>
            <CardContent>
              {codigosRejeicao.length > 0 ? (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={codigosRejeicao} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis 
                        type="category" 
                        dataKey="codigo" 
                        tick={{ fontSize: 12 }}
                        width={60}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="quantidade" 
                        name="Ocorrências"
                        fill="hsl(0, 78%, 55%)" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>Nenhuma rejeição no período</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribuicao" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gráfico de pizza - Distribuição por tipo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribuição por Tipo</CardTitle>
                <CardDescription>Proporção de cada tipo de evento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dadosPorTipo}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {dadosPorTipo.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Lista de eventos por tipo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detalhamento</CardTitle>
                <CardDescription>Quantidade por tipo de evento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dadosPorTipo.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                        />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{item.value}</Badge>
                        <span className="text-xs text-muted-foreground">
                          ({((item.value / stats.total) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Tempo de resposta por hora */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tempo de Resposta por Hora</CardTitle>
              <CardDescription>Média de tempo de resposta da SEFAZ por hora do dia</CardDescription>
            </CardHeader>
            <CardContent>
              {temposPorHora.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={temposPorHora}>
                      <XAxis 
                        dataKey="hora" 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${(value / 1000).toFixed(1)}s`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${(value / 1000).toFixed(2)}s`, 'Tempo médio']}
                      />
                      <Line
                        type="monotone"
                        dataKey="tempoMedio"
                        name="Tempo médio"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>Sem dados de tempo de resposta</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Métricas de performance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Tempo Mínimo</p>
                  <p className="text-2xl font-bold text-emerald-500">
                    {eventosFiltrados.length > 0 
                      ? ((Math.min(...eventosFiltrados.filter(e => e.tempoResposta).map(e => e.tempoResposta!)) || 0) / 1000).toFixed(2)
                      : '0'}s
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Tempo Médio</p>
                  <p className="text-2xl font-bold text-primary">
                    {(stats.tempoMedio / 1000).toFixed(2)}s
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Tempo Máximo</p>
                  <p className="text-2xl font-bold text-amber-500">
                    {eventosFiltrados.length > 0 
                      ? ((Math.max(...eventosFiltrados.filter(e => e.tempoResposta).map(e => e.tempoResposta!)) || 0) / 1000).toFixed(2)
                      : '0'}s
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
