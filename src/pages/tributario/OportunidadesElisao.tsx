// PÁGINA: Oportunidades de Elisão Fiscal (orquestrador modular)

import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Lightbulb, Save } from 'lucide-react';
import { useOportunidadesElisao } from '@/hooks/useOportunidadesElisao';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import type { RegimeAplicavel } from '@/lib/tributario/elisao';
import { ContextoForm } from './oportunidades-elisao/ContextoForm';
import { KpisCards } from './oportunidades-elisao/KpisCards';
import { AnaliseTab } from './oportunidades-elisao/AnaliseTab';
import { HistoricoTab } from './oportunidades-elisao/HistoricoTab';
import { AuditoriaTab } from './oportunidades-elisao/AuditoriaTab';
import { AlertasTab } from './oportunidades-elisao/AlertasTab';
import { AcoesTab } from './oportunidades-elisao/AcoesTab';

export default function OportunidadesElisao() {
  const { data: empresas = [] } = useAllEmpresas();
  const [empresaId, setEmpresaId] = useState<string | undefined>();
  const [regimeAtual, setRegimeAtual] = useState<RegimeAplicavel>('simples');
  const [pl, setPl] = useState<number>(0);
  const [lucro, setLucro] = useState<number>(0);
  const [importacao, setImportacao] = useState<number>(0);
  const [pd, setPd] = useState<number>(0);
  const [beneficioIcms, setBeneficioIcms] = useState<number>(0);
  const [dividendos, setDividendos] = useState<number>(0);
  const [uf, setUf] = useState<string>('');
  const [lucrosAcumulados, setLucrosAcumulados] = useState<number>(0);
  const [creditosPisCofins, setCreditosPisCofins] = useState<number>(0);
  const [investimentoMaquinas, setInvestimentoMaquinas] = useState<number>(0);
  const empresaSelecionada = empresas.find((e) => e.id === empresaId);

  const {
    relatorio,
    oportunidadesSalvas,
    persistirOportunidades,
    atualizarStatus,
    temHistoricoSuficiente,
    alertas,
    creditosAuditoria,
    tarefasAcionaveis,
    decidirCredito,
    sincronizarBitrix,
  } = useOportunidadesElisao({
    empresaId,
    contexto: {
      regime_atual: regimeAtual,
      patrimonio_liquido: pl,
      lucro_liquido: lucro,
      receita_importacao: importacao,
      despesas_pd: pd,
      beneficio_icms_anual: beneficioIcms,
      dividendos_pf_anual: dividendos,
      uf: uf || empresaSelecionada?.estado || undefined,
      lucros_acumulados_ate_2025: lucrosAcumulados,
      creditos_pis_cofins_nao_aproveitados: creditosPisCofins || undefined,
      investimento_maquinas_anual: investimentoMaquinas,
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Lightbulb className="h-8 w-8 text-primary" />
            Oportunidades de Elisão Fiscal
          </h1>
          <p className="text-muted-foreground mt-1">
            13 estratégias legais analisadas a partir do perfil tributário da empresa.
          </p>
        </div>
        <Button
          onClick={() => persistirOportunidades.mutate()}
          disabled={!empresaId || persistirOportunidades.isPending || relatorio.total_aplicaveis === 0}
        >
          <Save className="h-4 w-4 mr-2" />
          Salvar análise
        </Button>
      </div>

      <ContextoForm
        empresas={empresas}
        empresaId={empresaId}
        setEmpresaId={setEmpresaId}
        regimeAtual={regimeAtual}
        setRegimeAtual={setRegimeAtual}
        pl={pl} setPl={setPl}
        lucro={lucro} setLucro={setLucro}
        importacao={importacao} setImportacao={setImportacao}
        pd={pd} setPd={setPd}
        beneficioIcms={beneficioIcms} setBeneficioIcms={setBeneficioIcms}
        dividendos={dividendos} setDividendos={setDividendos}
        uf={uf} setUf={setUf}
        lucrosAcumulados={lucrosAcumulados} setLucrosAcumulados={setLucrosAcumulados}
        creditosPisCofins={creditosPisCofins} setCreditosPisCofins={setCreditosPisCofins}
        investimentoMaquinas={investimentoMaquinas} setInvestimentoMaquinas={setInvestimentoMaquinas}
      />

      {!temHistoricoSuficiente && empresaId && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Histórico financeiro incompleto</AlertTitle>
          <AlertDescription>
            Cadastre 12 meses de faturamento e folha em "Histórico Tributário" para análise mais precisa.
          </AlertDescription>
        </Alert>
      )}

      <KpisCards
        totalOportunidades={relatorio.total_oportunidades}
        totalAplicaveis={relatorio.total_aplicaveis}
        economiaTotal={relatorio.economia_total_estimada}
      />

      <Tabs defaultValue="analise">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="analise">Análise atual</TabsTrigger>
          <TabsTrigger value="historico">Estratégias ({oportunidadesSalvas.length})</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoria ({creditosAuditoria.length})</TabsTrigger>
          <TabsTrigger value="alertas">Alertas ({alertas.length})</TabsTrigger>
          <TabsTrigger value="acoes">Ações Bitrix ({tarefasAcionaveis.length})</TabsTrigger>
        </TabsList>

        <AnaliseTab relatorio={relatorio} />
        <HistoricoTab oportunidadesSalvas={oportunidadesSalvas} atualizarStatus={atualizarStatus} />
        <AuditoriaTab
          creditosAuditoria={creditosAuditoria}
          empresaRazaoSocial={empresaSelecionada?.razao_social || ''}
          decidirCredito={decidirCredito}
        />
        <AlertasTab alertas={alertas} />
        <AcoesTab tarefasAcionaveis={tarefasAcionaveis} sincronizarBitrix={sincronizarBitrix} />
      </Tabs>
    </div>
  );
}
