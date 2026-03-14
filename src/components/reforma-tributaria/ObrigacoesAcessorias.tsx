// ============================================
// COMPONENTE: OBRIGAÇÕES ACESSÓRIAS
// Dashboard de compliance tributário
// ============================================

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Send,
  Download,
  Bell,
  XCircle,
} from 'lucide-react';
import { format, addDays, isBefore, isAfter, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Definição das obrigações acessórias
const OBRIGACOES = [
  // Federais
  { codigo: 'EFD-CONTRIBUICOES', nome: 'EFD-Contribuições', esfera: 'federal', periodicidade: 'mensal', diaVencimento: 10, descricao: 'PIS/COFINS' },
  { codigo: 'EFD-REINF', nome: 'EFD-Reinf', esfera: 'federal', periodicidade: 'mensal', diaVencimento: 15, descricao: 'Retenções e informações fiscais' },
  { codigo: 'DCTF', nome: 'DCTF', esfera: 'federal', periodicidade: 'mensal', diaVencimento: 15, descricao: 'Declaração de Débitos e Créditos Tributários' },
  { codigo: 'ECF', nome: 'ECF', esfera: 'federal', periodicidade: 'anual', mesVencimento: 7, diaVencimento: 31, descricao: 'Escrituração Contábil Fiscal' },
  { codigo: 'ECD', nome: 'ECD', esfera: 'federal', periodicidade: 'anual', mesVencimento: 5, diaVencimento: 31, descricao: 'Escrituração Contábil Digital' },
  { codigo: 'DIRF', nome: 'DIRF', esfera: 'federal', periodicidade: 'anual', mesVencimento: 2, diaVencimento: 28, descricao: 'Declaração de IR Retido na Fonte' },
  { codigo: 'PERDCOMP', nome: 'PER/DCOMP', esfera: 'federal', periodicidade: 'eventual', descricao: 'Pedido de Restituição ou Compensação' },
  
  // Estaduais
  { codigo: 'EFD-ICMS-IPI', nome: 'EFD ICMS/IPI', esfera: 'estadual', periodicidade: 'mensal', diaVencimento: 25, descricao: 'SPED Fiscal' },
  { codigo: 'GIA', nome: 'GIA', esfera: 'estadual', periodicidade: 'mensal', diaVencimento: 15, descricao: 'Guia de Informação e Apuração' },
  { codigo: 'DESTDA', nome: 'DeSTDA', esfera: 'estadual', periodicidade: 'mensal', diaVencimento: 28, descricao: 'Diferencial de Alíquota - Simples' },
  
  // Municipais
  { codigo: 'NFE-SERVICO', nome: 'NF-e de Serviço', esfera: 'municipal', periodicidade: 'mensal', diaVencimento: 10, descricao: 'Declaração de serviços prestados' },
  
  // Novas obrigações da Reforma Tributária (a partir de 2026)
  { codigo: 'EFD-IBS-CBS', nome: 'EFD-IBS/CBS', esfera: 'federal', periodicidade: 'mensal', diaVencimento: 20, descricao: 'Escrituração IBS e CBS', vigenciaInicio: 2026 },
  { codigo: 'DARF-UNIFICADO', nome: 'DARF Unificado', esfera: 'federal', periodicidade: 'mensal', diaVencimento: 25, descricao: 'Recolhimento IBS + CBS', vigenciaInicio: 2026 },
];

type StatusObrigacao = 'pendente' | 'em_andamento' | 'transmitida' | 'atrasada' | 'nao_aplicavel';

interface ObrigacaoStatus {
  codigo: string;
  nome: string;
  esfera: string;
  competencia: string;
  vencimento: Date;
  status: StatusObrigacao;
  diasRestantes: number;
  transmitidaEm?: Date;
  protocolo?: string;
}

export function ObrigacoesAcessorias() {
  const hoje = new Date();
  const [anoSelecionado, setAnoSelecionado] = useState(hoje.getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState(hoje.getMonth() + 1);
  const [filtroEsfera, setFiltroEsfera] = useState<'todas' | 'federal' | 'estadual' | 'municipal'>('todas');

  // Gerar status das obrigações para o período
  const obrigacoesStatus = useMemo((): ObrigacaoStatus[] => {
    return OBRIGACOES
      .filter(ob => {
        // Filtrar por vigência
        if (ob.vigenciaInicio && anoSelecionado < ob.vigenciaInicio) return false;
        // Filtrar por esfera
        if (filtroEsfera !== 'todas' && ob.esfera !== filtroEsfera) return false;
        // Filtrar por periodicidade
        if (ob.periodicidade === 'anual') {
          return ob.mesVencimento === mesSelecionado;
        }
        if (ob.periodicidade === 'eventual') return false;
        return true;
      })
      .map(ob => {
        const vencimento = new Date(anoSelecionado, mesSelecionado - 1, ob.diaVencimento || 15);
        const diasRestantes = differenceInDays(vencimento, hoje);
        
        let status: StatusObrigacao = 'pendente';
        if (isBefore(vencimento, hoje)) {
          status = 'atrasada';
        } else if (diasRestantes <= 5) {
          status = 'em_andamento';
        }

        return {
          codigo: ob.codigo,
          nome: ob.nome,
          esfera: ob.esfera,
          competencia: `${String(mesSelecionado).padStart(2, '0')}/${anoSelecionado}`,
          vencimento,
          status,
          diasRestantes,
        };
      })
      .sort((a, b) => a.vencimento.getTime() - b.vencimento.getTime());
  }, [anoSelecionado, mesSelecionado, filtroEsfera]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = obrigacoesStatus.length;
    const pendentes = obrigacoesStatus.filter(o => o.status === 'pendente').length;
    const emAndamento = obrigacoesStatus.filter(o => o.status === 'em_andamento').length;
    const atrasadas = obrigacoesStatus.filter(o => o.status === 'atrasada').length;
    const transmitidas = obrigacoesStatus.filter(o => o.status === 'transmitida').length;
    const percentualConcluido = total > 0 ? (transmitidas / total) * 100 : 0;
    
    return { total, pendentes, emAndamento, atrasadas, transmitidas, percentualConcluido };
  }, [obrigacoesStatus]);

  const getStatusBadge = (status: StatusObrigacao, diasRestantes: number) => {
    switch (status) {
      case 'transmitida':
        return <Badge className="bg-success"><CheckCircle2 className="h-3 w-3 mr-1" />Transmitida</Badge>;
      case 'atrasada':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Atrasada</Badge>;
      case 'em_andamento':
        return <Badge className="bg-warning text-warning-foreground"><Clock className="h-3 w-3 mr-1" />{diasRestantes}d restantes</Badge>;
      case 'pendente':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      default:
        return <Badge variant="secondary">N/A</Badge>;
    }
  };

  const getEsferaBadge = (esfera: string) => {
    const cores: Record<string, string> = {
      federal: 'bg-blue-500',
      estadual: 'bg-emerald-500',
      municipal: 'bg-purple-500',
    };
    return <Badge className={cores[esfera]}>{esfera}</Badge>;
  };

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Obrigações Acessórias
          </h3>
          <p className="text-sm text-muted-foreground">
            Calendário de compliance tributário
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={filtroEsfera} onValueChange={(v: 'todas' | 'federal' | 'estadual' | 'municipal') => setFiltroEsfera(v)}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="federal">Federal</SelectItem>
              <SelectItem value="estadual">Estadual</SelectItem>
              <SelectItem value="municipal">Municipal</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(mesSelecionado)} onValueChange={v => setMesSelecionado(Number(v))}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {meses.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(anoSelecionado)} onValueChange={v => setAnoSelecionado(Number(v))}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map(a => (
                <SelectItem key={a} value={String(a)}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de Status */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <Progress value={stats.percentualConcluido} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendentes}</div>
            <p className="text-xs text-muted-foreground">Aguardando envio</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.emAndamento}</div>
            <p className="text-xs text-muted-foreground">Menos de 5 dias</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.atrasadas}</div>
            <p className="text-xs text-muted-foreground">Requer ação imediata</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Transmitidas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.transmitidas}</div>
            <p className="text-xs text-muted-foreground">{stats.percentualConcluido.toFixed(0)}% concluído</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Obrigações */}
      <Card>
        <CardHeader>
          <CardTitle>Calendário de Entregas - {meses[mesSelecionado - 1]}/{anoSelecionado}</CardTitle>
          <CardDescription>Obrigações ordenadas por data de vencimento</CardDescription>
        </CardHeader>
        <CardContent>
          {obrigacoesStatus.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Obrigação</TableHead>
                  <TableHead>Esfera</TableHead>
                  <TableHead>Competência</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {obrigacoesStatus.map((ob) => (
                  <TableRow key={ob.codigo} className={ob.status === 'atrasada' ? 'bg-red-50 dark:bg-red-950/10' : ''}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{ob.nome}</span>
                        <span className="text-xs text-muted-foreground ml-2">({ob.codigo})</span>
                      </div>
                    </TableCell>
                    <TableCell>{getEsferaBadge(ob.esfera)}</TableCell>
                    <TableCell>{ob.competencia}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(ob.vencimento, 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(ob.status, ob.diasRestantes)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant={ob.status === 'atrasada' ? 'destructive' : 'default'}>
                          <Send className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma obrigação para o período selecionado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerta sobre Reforma Tributária */}
      {anoSelecionado >= 2026 && (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-500" />
              Novas Obrigações - Reforma Tributária
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 bg-background rounded-lg">
                <h4 className="font-medium mb-2">EFD-IBS/CBS</h4>
                <p className="text-sm text-muted-foreground">
                  Nova escrituração digital unificada para IBS e CBS, substituindo parte das obrigações anteriores.
                  Entrega mensal até o dia 20.
                </p>
              </div>
              <div className="p-4 bg-background rounded-lg">
                <h4 className="font-medium mb-2">Split Payment</h4>
                <p className="text-sm text-muted-foreground">
                  Recolhimento automático no momento do pagamento. Controle através do DARF unificado mensal.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ObrigacoesAcessorias;
