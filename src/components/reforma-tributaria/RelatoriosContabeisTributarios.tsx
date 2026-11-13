import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, TrendingUp, TrendingDown, Calculator } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/formatters';
import { exportToCSV, exportToPDF } from '@/lib/export-utils';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import { useApuracoesTributarias } from '@/hooks/useApuracoesTributarias';
import { useCreditosTributarios } from '@/hooks/useCreditosTributarios';
import { useOperacoesTributaveis } from '@/hooks/useOperacoesTributaveis';
import type { Props, TipoRelatorio } from './RelatoriosContabeisTributarios.types';
import { RelatoriosContabeisTributariosFiltros } from './RelatoriosContabeisTributariosFiltros';
import { RelatoriosContabeisTributariosTabs } from './RelatoriosContabeisTributariosTabs';

export function RelatoriosContabeisTributarios({ empresaId: initialEmpresaId }: Props) {
  const [empresaId, setEmpresaId] = useState<string>(initialEmpresaId || '');
  const [periodoInicio, setPeriodoInicio] = useState(
    format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM')
  );
  const [periodoFim, setPeriodoFim] = useState(format(new Date(), 'yyyy-MM'));
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>('dre-tributario');

  const { data: empresas = [] } = useAllEmpresas();
  const { apuracoes = [] } = useApuracoesTributarias(empresaId || undefined);
  const { creditos = [] } = useCreditosTributarios(empresaId || undefined);
  const { operacoes = [] } = useOperacoesTributaveis(empresaId || undefined);
  const empresaSelecionada = empresas.find((e) => e.id === empresaId);

  const apuracoesPeriodo = useMemo(
    () => apuracoes.filter((a) => a.competencia >= periodoInicio && a.competencia <= periodoFim),
    [apuracoes, periodoInicio, periodoFim]
  );

  const totais = useMemo(
    () =>
      apuracoesPeriodo.reduce(
        (acc, ap) => ({
          cbsDebitos: acc.cbsDebitos + (ap.cbs_debitos || 0),
          cbsCreditos: acc.cbsCreditos + (ap.cbs_creditos || 0),
          cbsAPagar: acc.cbsAPagar + (ap.cbs_a_pagar || 0),
          ibsDebitos: acc.ibsDebitos + (ap.ibs_debitos || 0),
          ibsCreditos: acc.ibsCreditos + (ap.ibs_creditos || 0),
          ibsAPagar: acc.ibsAPagar + (ap.ibs_a_pagar || 0),
          isAPagar: acc.isAPagar + (ap.is_a_pagar || 0),
          pisResidual: acc.pisResidual + (ap.pis_residual || 0),
          cofinsResidual: acc.cofinsResidual + (ap.cofins_residual || 0),
          icmsResidual: acc.icmsResidual + (ap.icms_residual || 0),
          issResidual: acc.issResidual + (ap.iss_residual || 0),
        }),
        {
          cbsDebitos: 0,
          cbsCreditos: 0,
          cbsAPagar: 0,
          ibsDebitos: 0,
          ibsCreditos: 0,
          ibsAPagar: 0,
          isAPagar: 0,
          pisResidual: 0,
          cofinsResidual: 0,
          icmsResidual: 0,
          issResidual: 0,
        }
      ),
    [apuracoesPeriodo]
  );

  const faturamentoPeriodo = useMemo(
    () =>
      operacoes
        .filter((o) => ['venda', 'servico_prestado', 'exportacao'].includes(o.tipo_operacao))
        .filter(
          (o) =>
            o.data_operacao.substring(0, 7) >= periodoInicio &&
            o.data_operacao.substring(0, 7) <= periodoFim
        )
        .reduce((sum, o) => sum + o.valor_operacao, 0),
    [operacoes, periodoInicio, periodoFim]
  );

  const cargaTributariaEfetiva =
    faturamentoPeriodo > 0
      ? ((totais.cbsAPagar +
          totais.ibsAPagar +
          totais.isAPagar +
          totais.pisResidual +
          totais.cofinsResidual +
          totais.icmsResidual +
          totais.issResidual) /
          faturamentoPeriodo) *
        100
      : 0;

  const dadosDistribuicao = [
    { name: 'CBS', value: totais.cbsAPagar },
    { name: 'IBS', value: totais.ibsAPagar },
    { name: 'IS', value: totais.isAPagar },
    { name: 'PIS Res.', value: totais.pisResidual },
    { name: 'COFINS Res.', value: totais.cofinsResidual },
    { name: 'ICMS Res.', value: totais.icmsResidual },
  ].filter((d) => d.value > 0);

  const dadosEvolucao = apuracoesPeriodo.map((ap) => ({
    competencia: ap.competencia,
    cbs: ap.cbs_a_pagar || 0,
    ibs: ap.ibs_a_pagar || 0,
    residuais: (ap.pis_residual || 0) + (ap.cofins_residual || 0) + (ap.icms_residual || 0),
    total:
      (ap.cbs_a_pagar || 0) +
      (ap.ibs_a_pagar || 0) +
      (ap.is_a_pagar || 0) +
      (ap.pis_residual || 0) +
      (ap.cofins_residual || 0) +
      (ap.icms_residual || 0),
  }));

  const linhasDRE = [
    { grupo: 'RECEITAS', nivel: 0, bold: true },
    { grupo: 'Faturamento Bruto', nivel: 1, valor: faturamentoPeriodo },
    { grupo: '', nivel: 0, separador: true },
    { grupo: 'TRIBUTOS SOBRE VENDAS', nivel: 0, bold: true },
    { grupo: 'CBS - Débitos', nivel: 1, valor: -totais.cbsDebitos },
    { grupo: 'IBS - Débitos', nivel: 1, valor: -totais.ibsDebitos },
    { grupo: 'IS - Imposto Seletivo', nivel: 1, valor: -totais.isAPagar },
    { grupo: 'PIS (Residual)', nivel: 1, valor: -totais.pisResidual },
    { grupo: 'COFINS (Residual)', nivel: 1, valor: -totais.cofinsResidual },
    { grupo: 'ICMS (Residual)', nivel: 1, valor: -totais.icmsResidual },
    { grupo: 'ISS (Residual)', nivel: 1, valor: -totais.issResidual },
    { grupo: '', nivel: 0, separador: true },
    { grupo: 'CRÉDITOS RECUPERADOS', nivel: 0, bold: true },
    { grupo: 'CBS - Créditos', nivel: 1, valor: totais.cbsCreditos },
    { grupo: 'IBS - Créditos', nivel: 1, valor: totais.ibsCreditos },
    { grupo: '', nivel: 0, separador: true },
    { grupo: 'TRIBUTOS LÍQUIDOS A RECOLHER', nivel: 0, bold: true, destaque: true },
    { grupo: 'CBS a Recolher', nivel: 1, valor: -totais.cbsAPagar },
    { grupo: 'IBS a Recolher', nivel: 1, valor: -totais.ibsAPagar },
    { grupo: 'IS a Recolher', nivel: 1, valor: -totais.isAPagar },
    {
      grupo: 'Tributos Residuais',
      nivel: 1,
      valor: -(
        totais.pisResidual +
        totais.cofinsResidual +
        totais.icmsResidual +
        totais.issResidual
      ),
    },
    { grupo: '', nivel: 0, separador: true },
    {
      grupo: 'TOTAL TRIBUTOS',
      nivel: 0,
      bold: true,
      destaque: true,
      valor: -(
        totais.cbsAPagar +
        totais.ibsAPagar +
        totais.isAPagar +
        totais.pisResidual +
        totais.cofinsResidual +
        totais.icmsResidual +
        totais.issResidual
      ),
    },
    { grupo: 'Carga Tributária Efetiva', nivel: 0, percentual: cargaTributariaEfetiva },
  ];

  const handleExportar = (formato: 'pdf' | 'excel') => {
    if (!empresaId) {
      toast.error('Selecione uma empresa antes de exportar o relatório.');
      return;
    }

    const dados = linhasDRE
      .filter((linha) => typeof linha.valor === 'number')
      .map((linha) => ({ demonstrativo: linha.grupo, valor: Number(linha.valor) }));
    const colunas = [
      { key: 'demonstrativo', header: 'Demonstrativo' },
      {
        key: 'valor',
        header: 'Valor',
        formatter: (valor: unknown) => formatCurrency(typeof valor === 'number' ? valor : 0),
      },
    ] as const;
    const nomeBase = `relatorio-tributario-${empresaId}-${periodoInicio}-a-${periodoFim}`;

    if (formato === 'excel') {
      exportToCSV(dados, [...colunas], nomeBase);
      toast.success('Arquivo CSV compatível com Excel gerado.');
      return;
    }

    exportToPDF(dados, [...colunas], 'Relatório Contábil Tributário', {
      empresa: {
        razao_social: empresaSelecionada?.razao_social,
        cnpj: empresaSelecionada?.cnpj || undefined,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <RelatoriosContabeisTributariosFiltros
        empresaId={empresaId}
        setEmpresaId={setEmpresaId}
        empresas={empresas}
        periodoInicio={periodoInicio}
        setPeriodoInicio={setPeriodoInicio}
        periodoFim={periodoFim}
        setPeriodoFim={setPeriodoFim}
        handleExportar={handleExportar}
      />

      {empresaId && (
        <>
          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Calculator className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Carga Efetiva</p>
                    <p className="text-2xl font-bold">{cargaTributariaEfetiva.toFixed(2)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <TrendingDown className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Tributos</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(totais.cbsAPagar + totais.ibsAPagar + totais.isAPagar)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-success" />
                  <div>
                    <p className="text-sm text-muted-foreground">Créditos Período</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(totais.cbsCreditos + totais.ibsCreditos)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Faturamento</p>
                    <p className="text-2xl font-bold">{formatCurrency(faturamentoPeriodo)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <RelatoriosContabeisTributariosTabs
            tipoRelatorio={tipoRelatorio}
            setTipoRelatorio={setTipoRelatorio}
            linhasDRE={linhasDRE}
            empresaSelecionada={empresaSelecionada}
            periodoInicio={periodoInicio}
            periodoFim={periodoFim}
            faturamentoPeriodo={faturamentoPeriodo}
            totais={totais}
            dadosDistribuicao={dadosDistribuicao}
            dadosEvolucao={dadosEvolucao}
            creditos={creditos}
            cargaTributariaEfetiva={cargaTributariaEfetiva}
          />
        </>
      )}
    </div>
  );
}

export default RelatoriosContabeisTributarios;
