import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon, Activity, Calendar, CheckCircle2 } from 'lucide-react';
import { getEventos } from '@/lib/sefaz-event-logger';
import { SefazAnalyticsKPIs } from './sefaz-analytics/SefazAnalyticsKPIs';

const PIE_COLORS = ['hsl(160, 84%, 39%)', 'hsl(0, 84%, 60%)', 'hsl(38, 92%, 50%)', 'hsl(239, 84%, 67%)', 'hsl(258, 90%, 66%)'];
type Periodo = '24h' | '7d' | '30d' | '90d';

interface TooltipPayloadEntry { name: string; value: number; color: string; }
interface CustomTooltipProps { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string; }

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-sm mb-1">{label}</p>
        {payload.map((entry, index) => <p key={index} className="text-sm" style={{ color: entry.color }}>{entry.name}: {entry.value}</p>)}
      </div>
    );
  }
  return null;
};

export const SefazAnalytics = () => {
  const [periodo, setPeriodo] = useState<Periodo>('7d');
  const [activeTab, setActiveTab] = useState('visao-geral');

  const eventosFiltrados = useMemo(() => {
    const eventos = getEventos();
    const agora = new Date();
    const ms = { '24h': 24*60*60*1000, '7d': 7*24*60*60*1000, '30d': 30*24*60*60*1000, '90d': 90*24*60*60*1000 };
    const limite = new Date(agora.getTime() - ms[periodo]);
    return eventos.filter(e => e.timestamp >= limite);
  }, [periodo]);

  const stats = useMemo(() => {
    const total = eventosFiltrados.length;
    const autorizadas = eventosFiltrados.filter(e => e.tipo === 'AUTORIZACAO').length;
    const rejeitadas = eventosFiltrados.filter(e => e.tipo === 'REJEICAO').length;
    const cancelamentos = eventosFiltrados.filter(e => e.tipo === 'CANCELAMENTO').length;
    const erros = eventosFiltrados.filter(e => e.tipo === 'ERRO_CONEXAO' || e.tipo === 'TIMEOUT').length;
    const tempos = eventosFiltrados.filter(e => e.tempoResposta !== undefined).map(e => e.tempoResposta!);
    const tempoMedio = tempos.length > 0 ? tempos.reduce((a, b) => a + b, 0) / tempos.length : 0;
    return { total, autorizadas, rejeitadas, cancelamentos, erros, tempoMedio, taxaSucesso: total > 0 ? (autorizadas / total) * 100 : 0, taxaRejeicao: total > 0 ? (rejeitadas / total) * 100 : 0 };
  }, [eventosFiltrados]);

  const dadosTemporais = useMemo(() => {
    const grupos = new Map<string, { autorizadas: number; rejeitadas: number; total: number }>();
    eventosFiltrados.forEach(evento => {
      const chave = periodo === '24h' ? evento.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : evento.timestamp.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!grupos.has(chave)) grupos.set(chave, { autorizadas: 0, rejeitadas: 0, total: 0 });
      const g = grupos.get(chave)!; g.total++;
      if (evento.tipo === 'AUTORIZACAO') g.autorizadas++;
      else if (evento.tipo === 'REJEICAO') g.rejeitadas++;
    });
    return Array.from(grupos.entries()).map(([p, d]) => ({ periodo: p, ...d, taxa: d.total > 0 ? ((d.autorizadas / d.total) * 100).toFixed(1) : 0 })).reverse();
  }, [eventosFiltrados, periodo]);

  const dadosPorTipo = useMemo(() => {
    const tipos = new Map<string, number>();
    eventosFiltrados.forEach(e => tipos.set(e.tipo, (tipos.get(e.tipo) || 0) + 1));
    const labels: Record<string, string> = { AUTORIZACAO: 'Autorizadas', REJEICAO: 'Rejeitadas', CANCELAMENTO: 'Cancelamentos', ENVIO_LOTE: 'Envios', CONSULTA: 'Consultas', ERRO_CONEXAO: 'Erros', TIMEOUT: 'Timeouts', VALIDACAO: 'Validações' };
    return Array.from(tipos.entries()).map(([t, v]) => ({ name: labels[t] || t, value: v })).sort((a, b) => b.value - a.value);
  }, [eventosFiltrados]);

  const codigosRejeicao = useMemo(() => {
    const codigos = new Map<string, { count: number; motivo: string }>();
    eventosFiltrados.filter(e => e.tipo === 'REJEICAO').forEach(e => {
      if (!codigos.has(e.cStat)) codigos.set(e.cStat, { count: 0, motivo: e.xMotivo });
      codigos.get(e.cStat)!.count++;
    });
    return Array.from(codigos.entries()).map(([c, d]) => ({ codigo: c, quantidade: d.count, motivo: d.motivo.length > 30 ? d.motivo.slice(0, 30) + '...' : d.motivo })).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5);
  }, [eventosFiltrados]);

  const temposPorHora = useMemo(() => {
    const horas = new Map<number, number[]>();
    eventosFiltrados.filter(e => e.tempoResposta !== undefined).forEach(e => {
      const h = e.timestamp.getHours();
      if (!horas.has(h)) horas.set(h, []);
      horas.get(h)!.push(e.tempoResposta!);
    });
    return Array.from(horas.entries()).map(([h, t]) => ({ hora: `${h.toString().padStart(2, '0')}h`, tempoMedio: Math.round(t.reduce((a, b) => a + b, 0) / t.length), quantidade: t.length })).sort((a, b) => parseInt(a.hora) - parseInt(b.hora));
  }, [eventosFiltrados]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h3 className="text-lg font-semibold">Analytics SEFAZ</h3><p className="text-sm text-muted-foreground">Monitore o desempenho das comunicações com a SEFAZ</p></div>
        <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
          <SelectTrigger className="w-[140px]"><Calendar className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Últimas 24h</SelectItem><SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem><SelectItem value="90d">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <SefazAnalyticsKPIs {...stats} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="visao-geral" className="gap-2"><BarChart3 className="h-4 w-4" />Visão Geral</TabsTrigger>
          <TabsTrigger value="distribuicao" className="gap-2"><PieChartIcon className="h-4 w-4" />Distribuição</TabsTrigger>
          <TabsTrigger value="performance" className="gap-2"><Activity className="h-4 w-4" />Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-6">
          <Card><CardHeader><CardTitle className="text-base">Autorizações vs Rejeições</CardTitle><CardDescription>Volume de eventos ao longo do período</CardDescription></CardHeader>
            <CardContent><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={dadosTemporais}>
              <defs><linearGradient id="colorAutorizadas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(150, 70%, 42%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(150, 70%, 42%)" stopOpacity={0}/></linearGradient><linearGradient id="colorRejeitadas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(0, 78%, 55%)" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(0, 78%, 55%)" stopOpacity={0}/></linearGradient></defs>
              <XAxis dataKey="periodo" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} /><YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} /><Tooltip content={<CustomTooltip />} /><Legend />
              <Area type="monotone" dataKey="autorizadas" name="Autorizadas" stroke="hsl(150, 70%, 42%)" fillOpacity={1} fill="url(#colorAutorizadas)" />
              <Area type="monotone" dataKey="rejeitadas" name="Rejeitadas" stroke="hsl(0, 78%, 55%)" fillOpacity={1} fill="url(#colorRejeitadas)" />
            </AreaChart></ResponsiveContainer></div></CardContent></Card>

          <Card><CardHeader><CardTitle className="text-base">Principais Códigos de Rejeição</CardTitle></CardHeader>
            <CardContent>{codigosRejeicao.length > 0 ? (
              <div className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={codigosRejeicao} layout="vertical"><XAxis type="number" tick={{ fontSize: 12 }} /><YAxis type="category" dataKey="codigo" tick={{ fontSize: 12 }} width={60} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="quantidade" name="Ocorrências" fill="hsl(0, 78%, 55%)" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>
            ) : (<div className="h-[250px] flex items-center justify-center text-muted-foreground"><div className="text-center"><CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-30" /><p>Nenhuma rejeição no período</p></div></div>)}</CardContent></Card>
        </TabsContent>

        <TabsContent value="distribuicao" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card><CardHeader><CardTitle className="text-base">Distribuição por Tipo</CardTitle></CardHeader>
              <CardContent><div className="h-[300px]">{dadosPorTipo.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={dadosPorTipo} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {dadosPorTipo.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>
              ) : (<div className="h-full flex items-center justify-center text-muted-foreground"><p>Sem dados no período</p></div>)}</div></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">Volume por Tipo</CardTitle></CardHeader>
              <CardContent><div className="h-[300px]">{dadosPorTipo.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%"><BarChart data={dadosPorTipo}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="value" name="Quantidade" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
              ) : (<div className="h-full flex items-center justify-center text-muted-foreground"><p>Sem dados no período</p></div>)}</div></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card><CardHeader><CardTitle className="text-base">Tempo de Resposta por Hora</CardTitle></CardHeader>
            <CardContent><div className="h-[300px]">{temposPorHora.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%"><LineChart data={temposPorHora}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="hora" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}ms`} /><Tooltip content={<CustomTooltip />} /><Legend />
                <Line type="monotone" dataKey="tempoMedio" name="Tempo Médio (ms)" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
              </LineChart></ResponsiveContainer>
            ) : (<div className="h-full flex items-center justify-center text-muted-foreground"><p>Sem dados de performance</p></div>)}</div></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
