import { useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Minus, Info, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/formatters';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

interface IndicadorBenchmark {
  nome: string;
  descricao: string;
  valorEmpresa: number;
  valorMercado: number;
  unidade: 'percent' | 'currency' | 'days' | 'ratio';
  melhorQuando: 'maior' | 'menor' | 'igual';
}

// Dados de benchmark do setor (simulados - em produção viriam de uma API)
const BENCHMARKS_SETOR = {
  inadimplencia: 5.2, // %
  prazoMedioRecebimento: 45, // dias
  prazoMedioPagamento: 35, // dias
  margemOperacional: 12, // %
  liquidezCorrente: 1.5, // ratio
  cicloFinanceiro: 55, // dias
  custoOperacional: 8, // % sobre receita
  crescimentoReceita: 8, // % a.a.
};

export function BenchmarkingSetorial() {
  const hoje = new Date();
  const inicioMes = startOfMonth(hoje);
  const fimMes = endOfMonth(hoje);
  const inicioMesAnterior = startOfMonth(subMonths(hoje, 1));

  // Buscar dados da empresa
  const { data: dadosEmpresa } = useQuery({
    queryKey: ['benchmarking-empresa'],
    queryFn: async () => {
      // Contas a receber
      const { data: receber } = await supabase
        .from('contas_receber')
        .select('valor, data_vencimento, status, data_recebimento')
        .gte('data_vencimento', format(subMonths(hoje, 6), 'yyyy-MM-dd'));

      // Contas a pagar
      const { data: pagar } = await supabase
        .from('contas_pagar')
        .select('valor, data_vencimento, status, data_pagamento')
        .gte('data_vencimento', format(subMonths(hoje, 6), 'yyyy-MM-dd'));

      const totalReceber = receber?.reduce((sum, r) => sum + r.valor, 0) || 0;
      const vencidos = receber?.filter(r => r.status === 'vencido') || [];
      const totalVencido = vencidos.reduce((sum, r) => sum + r.valor, 0);
      
      // Calcular prazos médios
      const recebidos = receber?.filter(r => r.status === 'pago' && r.data_recebimento) || [];
      const prazoMedioRec = recebidos.length > 0
        ? recebidos.reduce((sum, r) => {
            const diff = new Date(r.data_recebimento!).getTime() - new Date(r.data_vencimento).getTime();
            return sum + diff / (1000 * 60 * 60 * 24);
          }, 0) / recebidos.length
        : 45;

      const pagos = pagar?.filter(p => p.status === 'pago' && p.data_pagamento) || [];
      const prazoMedioPag = pagos.length > 0
        ? pagos.reduce((sum, p) => {
            const diff = new Date(p.data_pagamento!).getTime() - new Date(p.data_vencimento).getTime();
            return sum + diff / (1000 * 60 * 60 * 24);
          }, 0) / pagos.length
        : 35;

      return {
        taxaInadimplencia: totalReceber > 0 ? (totalVencido / totalReceber) * 100 : 0,
        prazoMedioRecebimento: Math.max(0, prazoMedioRec + 30), // Ajuste para prazo desde emissão
        prazoMedioPagamento: Math.max(0, prazoMedioPag + 30),
        cicloFinanceiro: prazoMedioRec - prazoMedioPag + 30,
      };
    }
  });

  const indicadores = useMemo((): IndicadorBenchmark[] => {
    const dados = dadosEmpresa || {
      taxaInadimplencia: 0,
      prazoMedioRecebimento: 45,
      prazoMedioPagamento: 35,
      cicloFinanceiro: 40,
    };

    return [
      {
        nome: 'Taxa de Inadimplência',
        descricao: 'Percentual de recebíveis vencidos sobre o total',
        valorEmpresa: dados.taxaInadimplencia,
        valorMercado: BENCHMARKS_SETOR.inadimplencia,
        unidade: 'percent',
        melhorQuando: 'menor',
      },
      {
        nome: 'Prazo Médio de Recebimento',
        descricao: 'Dias médios entre venda e recebimento',
        valorEmpresa: dados.prazoMedioRecebimento,
        valorMercado: BENCHMARKS_SETOR.prazoMedioRecebimento,
        unidade: 'days',
        melhorQuando: 'menor',
      },
      {
        nome: 'Prazo Médio de Pagamento',
        descricao: 'Dias médios entre compra e pagamento',
        valorEmpresa: dados.prazoMedioPagamento,
        valorMercado: BENCHMARKS_SETOR.prazoMedioPagamento,
        unidade: 'days',
        melhorQuando: 'maior',
      },
      {
        nome: 'Ciclo Financeiro',
        descricao: 'Dias entre pagamento a fornecedores e recebimento de clientes',
        valorEmpresa: dados.cicloFinanceiro,
        valorMercado: BENCHMARKS_SETOR.cicloFinanceiro,
        unidade: 'days',
        melhorQuando: 'menor',
      },
      {
        nome: 'Liquidez Corrente',
        descricao: 'Capacidade de pagar dívidas de curto prazo',
        valorEmpresa: 1.8, // Simulado
        valorMercado: BENCHMARKS_SETOR.liquidezCorrente,
        unidade: 'ratio',
        melhorQuando: 'maior',
      },
      {
        nome: 'Custo Operacional',
        descricao: 'Percentual dos custos operacionais sobre receita',
        valorEmpresa: 7.5, // Simulado
        valorMercado: BENCHMARKS_SETOR.custoOperacional,
        unidade: 'percent',
        melhorQuando: 'menor',
      },
    ];
  }, [dadosEmpresa]);

  const getComparativo = (ind: IndicadorBenchmark) => {
    const diff = ind.valorEmpresa - ind.valorMercado;
    const percentDiff = ind.valorMercado !== 0 ? (diff / ind.valorMercado) * 100 : 0;
    
    let status: 'melhor' | 'pior' | 'igual';
    if (Math.abs(percentDiff) < 5) {
      status = 'igual';
    } else if (
      (ind.melhorQuando === 'maior' && diff > 0) ||
      (ind.melhorQuando === 'menor' && diff < 0)
    ) {
      status = 'melhor';
    } else {
      status = 'pior';
    }

    return { diff, percentDiff, status };
  };

  const formatarValor = (valor: number, unidade: IndicadorBenchmark['unidade']) => {
    switch (unidade) {
      case 'percent':
        return `${valor.toFixed(1)}%`;
      case 'currency':
        return formatCurrency(valor);
      case 'days':
        return `${Math.round(valor)} dias`;
      case 'ratio':
        return valor.toFixed(2);
    }
  };

  const getStatusIcon = (status: 'melhor' | 'pior' | 'igual') => {
    switch (status) {
      case 'melhor':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'pior':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      case 'igual':
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: 'melhor' | 'pior' | 'igual') => {
    switch (status) {
      case 'melhor':
        return 'bg-success';
      case 'pior':
        return 'bg-destructive';
      case 'igual':
        return 'bg-muted-foreground';
    }
  };

  // Calcular score geral
  const scoreGeral = useMemo(() => {
    let pontos = 0;
    indicadores.forEach(ind => {
      const { status } = getComparativo(ind);
      if (status === 'melhor') pontos += 2;
      else if (status === 'igual') pontos += 1;
    });
    return Math.round((pontos / (indicadores.length * 2)) * 100);
  }, [indicadores]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <div>
              <CardTitle>Benchmarking Setorial</CardTitle>
              <CardDescription>
                Compare seus indicadores com a média do mercado
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Score Geral</p>
            <p className={`text-2xl font-bold ${
              scoreGeral >= 70 ? 'text-emerald-500' : 
              scoreGeral >= 50 ? 'text-yellow-500' : 'text-destructive'
            }`}>
              {scoreGeral}%
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <TooltipProvider>
          {indicadores.map((ind, idx) => {
            const { status, percentDiff } = getComparativo(ind);
            const progressValue = Math.min(100, (ind.valorEmpresa / (ind.valorMercado * 2)) * 100);
            
            return (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{ind.descricao}</p>
                      </TooltipContent>
                    </Tooltip>
                    <span className="font-medium text-sm">{ind.nome}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status)}
                    <Badge variant={
                      status === 'melhor' ? 'default' : 
                      status === 'pior' ? 'destructive' : 'secondary'
                    }>
                      {status === 'melhor' ? 'Acima' : status === 'pior' ? 'Abaixo' : 'Na média'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`absolute h-full ${getStatusColor(status)} transition-all`}
                        style={{ width: `${progressValue}%` }}
                      />
                      <div 
                        className="absolute h-full w-0.5 bg-primary"
                        style={{ left: '50%' }}
                      />
                    </div>
                  </div>
                  <div className="w-32 text-right">
                    <span className="font-semibold">
                      {formatarValor(ind.valorEmpresa, ind.unidade)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      / {formatarValor(ind.valorMercado, ind.unidade)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </TooltipProvider>

        <div className="mt-6 p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Referência de Mercado</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Os dados de benchmark são baseados em médias do setor de comércio e serviços. 
            Indicadores individuais podem variar conforme o segmento específico de atuação.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
