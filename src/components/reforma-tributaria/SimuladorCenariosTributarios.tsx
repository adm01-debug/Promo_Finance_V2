// ============================================
// SIMULADOR DE CENÁRIOS TRIBUTÁRIOS
// Comparação sistema antigo vs novo
// ============================================

import { useState, useMemo } from 'react';
import useReformaTributaria from '@/hooks/useReformaTributaria';
import { RegimeEspecial, CategoriaIS } from '@/types/reforma-tributaria';
import { SimuladorInputForm } from './simulador/SimuladorInputForm';
import { SimuladorResultadoCard } from './simulador/SimuladorResultadoCard';
import { SimuladorChartsGrid } from './simulador/SimuladorChartsGrid';

export function SimuladorCenariosTributarios() {
  const { executarSimulacao, isSimulando, simularCenario, regimesEspeciais, anoReferencia } =
    useReformaTributaria();

  const [faturamentoAnual, setFaturamentoAnual] = useState(5000000);
  const [comprasAnual, setComprasAnual] = useState(2500000);
  const [servicosTomadosAnual, setServicosTomadosAnual] = useState(500000);
  const [percentualVendas, setPercentualVendas] = useState(80);
  const [percentualServicos, setPercentualServicos] = useState(20);
  const [regimeEspecial, setRegimeEspecial] = useState<RegimeEspecial>('nenhum');
  const [temProdutosIS, setTemProdutosIS] = useState(false);
  const [categoriaIS, setCategoriaIS] = useState<CategoriaIS>('bebidas_alcoolicas');

  const [resultadosProjecao, setResultadosProjecao] = useState<
    { ano: number; resultado: ReturnType<typeof simularCenario> }[]
  >([]);

  const resultadoAtual = useMemo(() => {
    return simularCenario(
      {
        faturamentoAnual,
        comprasAnual,
        servicosTomadosAnual,
        percentualVendas,
        percentualServicos,
        regimeEspecial,
        temProdutosIS,
        categoriaIS: temProdutosIS ? categoriaIS : undefined,
      },
      anoReferencia,
    );
  }, [
    faturamentoAnual,
    comprasAnual,
    servicosTomadosAnual,
    percentualVendas,
    percentualServicos,
    regimeEspecial,
    temProdutosIS,
    categoriaIS,
    anoReferencia,
    simularCenario,
  ]);

  const handleExecutarProjecao = async () => {
    const dados = {
      faturamentoAnual,
      comprasAnual,
      servicosTomadosAnual,
      percentualVendas,
      percentualServicos,
      regimeEspecial,
      temProdutosIS,
      categoriaIS: temProdutosIS ? categoriaIS : undefined,
    };

    const resultados = await executarSimulacao(dados);
    setResultadosProjecao(resultados);
  };

  const dadosComparativo = [
    { categoria: 'ICMS', antigo: resultadoAtual.icmsAntigo, novo: 0 },
    { categoria: 'ISS', antigo: resultadoAtual.issAntigo, novo: 0 },
    { categoria: 'PIS', antigo: resultadoAtual.pisAntigo, novo: 0 },
    { categoria: 'COFINS', antigo: resultadoAtual.cofinsAntigo, novo: 0 },
    { categoria: 'CBS', antigo: 0, novo: resultadoAtual.cbsNovo },
    { categoria: 'IBS', antigo: 0, novo: resultadoAtual.ibsNovo },
    { categoria: 'IS', antigo: 0, novo: resultadoAtual.isNovo },
  ].filter((d) => d.antigo > 0 || d.novo > 0);

  const dadosProjecao = resultadosProjecao.map(({ ano, resultado }) => ({
    ano: String(ano),
    antigo: resultado.totalAntigo,
    novo: resultado.totalNovo,
    diferenca: resultado.totalNovo - resultado.totalAntigo,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <SimuladorInputForm
          faturamentoAnual={faturamentoAnual}
          setFaturamentoAnual={setFaturamentoAnual}
          comprasAnual={comprasAnual}
          setComprasAnual={setComprasAnual}
          servicosTomadosAnual={servicosTomadosAnual}
          setServicosTomadosAnual={setServicosTomadosAnual}
          percentualVendas={percentualVendas}
          setPercentualVendas={setPercentualVendas}
          percentualServicos={percentualServicos}
          setPercentualServicos={setPercentualServicos}
          regimeEspecial={regimeEspecial}
          setRegimeEspecial={setRegimeEspecial}
          temProdutosIS={temProdutosIS}
          setTemProdutosIS={setTemProdutosIS}
          categoriaIS={categoriaIS}
          setCategoriaIS={setCategoriaIS}
          regimesEspeciais={regimesEspeciais}
          isSimulando={isSimulando}
          onExecutarProjecao={handleExecutarProjecao}
        />

        <SimuladorResultadoCard resultado={resultadoAtual} anoReferencia={anoReferencia} />
      </div>

      <SimuladorChartsGrid dadosComparativo={dadosComparativo} dadosProjecao={dadosProjecao} />
    </div>
  );
}

export default SimuladorCenariosTributarios;
