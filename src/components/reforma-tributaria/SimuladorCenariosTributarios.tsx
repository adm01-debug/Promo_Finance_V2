// SIMULADOR DE CENÁRIOS TRIBUTÁRIOS
// Comparação sistema antigo vs novo

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
  const [aliquotaISCustomizada, setAliquotaISCustomizada] = useState(0);
  const [cenarioCBS, setCenarioCBS] = useState<'tcu' | 'livre' | undefined>(undefined);
  const [aliquotaCBSOverride, setAliquotaCBSOverride] = useState(11.2);

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
        aliquotaISCustomizada: temProdutosIS ? aliquotaISCustomizada : undefined,
      },
      anoReferencia
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
    aliquotaISCustomizada,
    cenarioCBS,
    aliquotaCBSOverride,
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
      aliquotaISCustomizada: temProdutosIS ? aliquotaISCustomizada : undefined,
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

  const isSimulado = !!cenarioCBS;

  return (
    <div className="space-y-6">
      {/* Seletor de cenário CBS — etapa 92 */}
      <div className="flex flex-wrap items-end gap-4 p-4 rounded-lg border bg-muted/30">
        <div className="space-y-1">
          <label className="text-sm font-medium">Cenário CBS</label>
          <select
            className="border rounded px-2 py-1 text-sm bg-background"
            value={cenarioCBS ?? ''}
            onChange={(e) =>
              setCenarioCBS((e.target.value || undefined) as 'tcu' | 'livre' | undefined)
            }
          >
            <option value="">Tabela de transição (padrão)</option>
            <option value="tcu">11,2% — Estimativa TCU (2024)</option>
            <option value="livre">Valor livre</option>
          </select>
        </div>
        {cenarioCBS === 'livre' && (
          <div className="space-y-1">
            <label className="text-sm font-medium">Alíquota CBS (%)</label>
            <input
              type="number"
              min={0}
              max={30}
              step={0.1}
              className="border rounded px-2 py-1 text-sm w-24 bg-background"
              value={aliquotaCBSOverride}
              onChange={(e) => setAliquotaCBSOverride(Number(e.target.value))}
            />
          </div>
        )}
        {isSimulado && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1 text-xs font-semibold">
            ⚠️ Simulado — alíquota CBS sujeita à resolução do Senado
          </span>
        )}
      </div>
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
          aliquotaISCustomizada={aliquotaISCustomizada}
          setAliquotaISCustomizada={setAliquotaISCustomizada}
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
