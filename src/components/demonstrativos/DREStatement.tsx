import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useContasPagar, useContasReceber } from '@/hooks/useFinancialData';
import { formatCurrency, formatPercentage } from '@/lib/formatters';

interface DREStatementProps {
  periodo: string;
  mes: number;
  ano: number;
  empresaId: string;
}

interface DRELinha {
  codigo: string;
  descricao: string;
  valor: number;
  percentual: number;
  nivel: number;
  tipo: 'receita' | 'despesa' | 'resultado';
}

export const DREStatement = ({ periodo, mes, ano, empresaId }: DREStatementProps) => {
  const { data: contasReceber } = useContasReceber();
  const { data: contasPagar } = useContasPagar();

  const dre = useMemo(() => {
    const dataInicio = new Date(ano, mes, 1);
    const dataFim = new Date(ano, mes + 1, 0);

    // Filtrar por período e empresa
    const recebimentos = (contasReceber || []).filter(cr => {
      const data = new Date(cr.data_vencimento);
      const dentroPerido = data >= dataInicio && data <= dataFim;
      const daEmpresa = empresaId === 'todas' || cr.empresa_id === empresaId;
      return dentroPerido && daEmpresa && cr.status === 'pago';
    });

    const pagamentos = (contasPagar || []).filter(cp => {
      const data = new Date(cp.data_vencimento);
      const dentroPerido = data >= dataInicio && data <= dataFim;
      const daEmpresa = empresaId === 'todas' || cp.empresa_id === empresaId;
      return dentroPerido && daEmpresa && cp.status === 'pago';
    });

    // Calcular valores
    const receitaBrutaVendas = recebimentos.reduce((acc, r) => acc + (r.valor_recebido || r.valor), 0);
    const deducoesVendas = receitaBrutaVendas * 0.0925; // Simples Nacional aproximado
    const receitaLiquida = receitaBrutaVendas - deducoesVendas;

    // Custos por categoria (simulado baseado em centro de custo)
    const custoMercadoria = pagamentos
      .filter(p => p.centros_custo?.nome?.toLowerCase().includes('mercadoria') || 
                   p.centros_custo?.nome?.toLowerCase().includes('produto'))
      .reduce((acc, p) => acc + (p.valor_pago || p.valor), 0);

    const lucroBruto = receitaLiquida - custoMercadoria;

    // Despesas operacionais
    const despesasAdministrativas = pagamentos
      .filter(p => p.centros_custo?.nome?.toLowerCase().includes('admin'))
      .reduce((acc, p) => acc + (p.valor_pago || p.valor), 0);

    const despesasComerciais = pagamentos
      .filter(p => p.centros_custo?.nome?.toLowerCase().includes('comercial') ||
                   p.centros_custo?.nome?.toLowerCase().includes('vendas'))
      .reduce((acc, p) => acc + (p.valor_pago || p.valor), 0);

    const outrasDespesas = pagamentos
      .filter(p => !p.centros_custo?.nome?.toLowerCase().includes('mercadoria') &&
                   !p.centros_custo?.nome?.toLowerCase().includes('produto') &&
                   !p.centros_custo?.nome?.toLowerCase().includes('admin') &&
                   !p.centros_custo?.nome?.toLowerCase().includes('comercial') &&
                   !p.centros_custo?.nome?.toLowerCase().includes('vendas'))
      .reduce((acc, p) => acc + (p.valor_pago || p.valor), 0);

    const totalDespesasOperacionais = despesasAdministrativas + despesasComerciais + outrasDespesas;
    const lucroOperacional = lucroBruto - totalDespesasOperacionais;

    // Resultado financeiro (simplificado)
    const receitasFinanceiras = 0;
    const despesasFinanceiras = 0;
    const resultadoFinanceiro = receitasFinanceiras - despesasFinanceiras;

    const lucroAntesIR = lucroOperacional + resultadoFinanceiro;
    const irCs = lucroAntesIR > 0 ? lucroAntesIR * 0.15 : 0; // Simplificado
    const lucroLiquido = lucroAntesIR - irCs;

    const linhas: DRELinha[] = [
      { codigo: '1', descricao: 'RECEITA BRUTA DE VENDAS', valor: receitaBrutaVendas, percentual: 100, nivel: 0, tipo: 'receita' },
      { codigo: '1.1', descricao: 'Venda de Mercadorias', valor: receitaBrutaVendas, percentual: 100, nivel: 1, tipo: 'receita' },
      { codigo: '2', descricao: '(-) DEDUÇÕES DA RECEITA', valor: -deducoesVendas, percentual: receitaBrutaVendas ? (deducoesVendas / receitaBrutaVendas) * 100 : 0, nivel: 0, tipo: 'despesa' },
      { codigo: '2.1', descricao: 'Impostos sobre Vendas', valor: -deducoesVendas, percentual: receitaBrutaVendas ? (deducoesVendas / receitaBrutaVendas) * 100 : 0, nivel: 1, tipo: 'despesa' },
      { codigo: '3', descricao: '(=) RECEITA LÍQUIDA', valor: receitaLiquida, percentual: receitaBrutaVendas ? (receitaLiquida / receitaBrutaVendas) * 100 : 0, nivel: 0, tipo: 'resultado' },
      { codigo: '4', descricao: '(-) CUSTO DAS MERCADORIAS VENDIDAS', valor: -custoMercadoria, percentual: receitaBrutaVendas ? (custoMercadoria / receitaBrutaVendas) * 100 : 0, nivel: 0, tipo: 'despesa' },
      { codigo: '5', descricao: '(=) LUCRO BRUTO', valor: lucroBruto, percentual: receitaBrutaVendas ? (lucroBruto / receitaBrutaVendas) * 100 : 0, nivel: 0, tipo: 'resultado' },
      { codigo: '6', descricao: '(-) DESPESAS OPERACIONAIS', valor: -totalDespesasOperacionais, percentual: receitaBrutaVendas ? (totalDespesasOperacionais / receitaBrutaVendas) * 100 : 0, nivel: 0, tipo: 'despesa' },
      { codigo: '6.1', descricao: 'Despesas Administrativas', valor: -despesasAdministrativas, percentual: receitaBrutaVendas ? (despesasAdministrativas / receitaBrutaVendas) * 100 : 0, nivel: 1, tipo: 'despesa' },
      { codigo: '6.2', descricao: 'Despesas Comerciais', valor: -despesasComerciais, percentual: receitaBrutaVendas ? (despesasComerciais / receitaBrutaVendas) * 100 : 0, nivel: 1, tipo: 'despesa' },
      { codigo: '6.3', descricao: 'Outras Despesas Operacionais', valor: -outrasDespesas, percentual: receitaBrutaVendas ? (outrasDespesas / receitaBrutaVendas) * 100 : 0, nivel: 1, tipo: 'despesa' },
      { codigo: '7', descricao: '(=) LUCRO OPERACIONAL', valor: lucroOperacional, percentual: receitaBrutaVendas ? (lucroOperacional / receitaBrutaVendas) * 100 : 0, nivel: 0, tipo: 'resultado' },
      { codigo: '8', descricao: '(+/-) RESULTADO FINANCEIRO', valor: resultadoFinanceiro, percentual: 0, nivel: 0, tipo: 'resultado' },
      { codigo: '9', descricao: '(=) LUCRO ANTES DO IR/CSLL', valor: lucroAntesIR, percentual: receitaBrutaVendas ? (lucroAntesIR / receitaBrutaVendas) * 100 : 0, nivel: 0, tipo: 'resultado' },
      { codigo: '10', descricao: '(-) IRPJ/CSLL', valor: -irCs, percentual: receitaBrutaVendas ? (irCs / receitaBrutaVendas) * 100 : 0, nivel: 0, tipo: 'despesa' },
      { codigo: '11', descricao: '(=) LUCRO LÍQUIDO DO EXERCÍCIO', valor: lucroLiquido, percentual: receitaBrutaVendas ? (lucroLiquido / receitaBrutaVendas) * 100 : 0, nivel: 0, tipo: 'resultado' },
    ];

    return { linhas, lucroLiquido, receitaBrutaVendas };
  }, [contasReceber, contasPagar, mes, ano, empresaId]);

  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Demonstração do Resultado do Exercício
            </CardTitle>
            <CardDescription>
              Período: {meses[mes]} de {ano}
            </CardDescription>
          </div>
          <Badge variant={dre.lucroLiquido >= 0 ? 'default' : 'destructive'} className="text-sm">
            {dre.lucroLiquido >= 0 ? 'Lucro' : 'Prejuízo'}: {formatCurrency(Math.abs(dre.lucroLiquido))}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-semibold text-sm">Código</th>
                <th className="text-left p-3 font-semibold text-sm">Descrição</th>
                <th className="text-right p-3 font-semibold text-sm">Valor (R$)</th>
                <th className="text-right p-3 font-semibold text-sm">AV (%)</th>
              </tr>
            </thead>
            <tbody>
              {dre.linhas.map((linha, index) => (
                <motion.tr
                  key={linha.codigo}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`
                    border-t border-border/30 transition-colors hover:bg-muted/30
                    ${linha.nivel === 0 ? 'font-semibold bg-muted/20' : ''}
                    ${linha.codigo === '11' ? 'bg-primary/10 font-bold' : ''}
                  `}
                >
                  <td className="p-3 text-sm text-muted-foreground">{linha.codigo}</td>
                  <td className={`p-3 text-sm ${linha.nivel === 1 ? 'pl-8' : ''}`}>
                    {linha.descricao}
                  </td>
                  <td className={`p-3 text-sm text-right tabular-nums ${
                    linha.valor > 0 ? 'text-success' : linha.valor < 0 ? 'text-destructive' : ''
                  }`}>
                    {formatCurrency(Math.abs(linha.valor))}
                    {linha.valor > 0 && linha.tipo !== 'resultado' && (
                      <TrendingUp className="inline ml-1 h-3 w-3" />
                    )}
                    {linha.valor < 0 && (
                      <TrendingDown className="inline ml-1 h-3 w-3" />
                    )}
                  </td>
                  <td className="p-3 text-sm text-right tabular-nums text-muted-foreground">
                    {linha.percentual.toFixed(1)}%
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          <p>AV = Análise Vertical (% sobre Receita Bruta)</p>
        </div>
      </CardContent>
    </Card>
  );
};
