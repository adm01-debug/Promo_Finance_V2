import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calculator, Save, RefreshCw, FileDown, Database } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { calcularTodosRegimes, type InputCalculadora, type ResultadoRegime } from '@/lib/tributario/calculadora';
import { NumberField } from '@/components/tributario/calculadora/NumberField';
import { ResultadoBreakdown } from '@/components/tributario/calculadora/ResultadoBreakdown';
import { MemoriaCalculo } from '@/components/tributario/calculadora/MemoriaCalculo';
import { ComparativoRegimes } from '@/components/tributario/calculadora/ComparativoRegimes';
import { HistoricoCenariosCalculadora } from '@/components/tributario/calculadora/HistoricoCenariosCalculadora';
import { useCalculadoraDadosReais } from '@/hooks/useCalculadoraDadosReais';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import { gerarPdfMemorialCalculo } from '@/lib/tributario/relatorio-pdf/memorial';

type CampoInput = {
  receitaBrutaAnual: number;
  percentualServicos: number;
  lucroContabil: number;
  folhaAnual: number;
  aliquotaRat: number;
  aliquotaTerceiros: number;
  aliquotaIcms: number;
  aliquotaIss: number;
  creditoIcmsCompras: number;
  csllFinanceira: boolean;
  prejuizoAcumulado: number;
  adicoesLalur: number;
  exclusoesLalur: number;
  creditoPisCofinsInsumos: number;
  creditoPisCofinsEnergia: number;
  creditoPisCofinsAlugueis: number;
  creditoPisCofinsFretes: number;
  irrfSofrido: number;
  csrfSofrido: number;
  atividadePresumido: 'comercio' | 'industria' | 'servicos_geral' | 'transporte_cargas' | 'servicos_hospitalares';
  anexoSimples: 'I' | 'II' | 'III' | 'IV' | 'V';
  rbt12: number;
  folha12m: number;
  anoReforma: number;
  categoriaSeletivo: 'nenhum' | 'bebidas_alcoolicas' | 'fumo' | 'veiculos' | 'bens_luxo';
  reducaoReforma: number;
};

const DEFAULT_INPUT: CampoInput = {
  receitaBrutaAnual: 3_000_000,
  percentualServicos: 30,
  lucroContabil: 500_000,
  folhaAnual: 400_000,
  aliquotaRat: 0.02,
  aliquotaTerceiros: 0.058,
  aliquotaIcms: 0.18,
  aliquotaIss: 0.05,
  creditoIcmsCompras: 0,
  csllFinanceira: false,
  prejuizoAcumulado: 0,
  adicoesLalur: 0,
  exclusoesLalur: 0,
  creditoPisCofinsInsumos: 800_000,
  creditoPisCofinsEnergia: 0,
  creditoPisCofinsAlugueis: 0,
  creditoPisCofinsFretes: 0,
  irrfSofrido: 0,
  csrfSofrido: 0,
  atividadePresumido: 'comercio',
  anexoSimples: 'I',
  rbt12: 3_000_000,
  folha12m: 400_000,
  anoReforma: 2026,
  categoriaSeletivo: 'nenhum',
  reducaoReforma: 0,
};

function buildInput(f: CampoInput): InputCalculadora {
  const receitas = { receitaBrutaAnual: f.receitaBrutaAnual, percentualServicos: f.percentualServicos };
  const folha = { folhaAnual: f.folhaAnual, aliquotaRat: f.aliquotaRat, aliquotaTerceiros: f.aliquotaTerceiros };
  const estadualMunicipal = { aliquotaIcms: f.aliquotaIcms, aliquotaIss: f.aliquotaIss, creditoIcmsCompras: f.creditoIcmsCompras };
  const retencoes = { irrfSofrido: f.irrfSofrido, csrfSofrido: f.csrfSofrido };
  return {
    lucroReal: {
      receitas, folha, estadualMunicipal, retencoes,
      lucroContabil: f.lucroContabil,
      lalur: { adicoesOutras: f.adicoesLalur, exclusoesOutras: f.exclusoesLalur },
      prejuizoAcumulado: f.prejuizoAcumulado,
      csllAliquotaFinanceira: f.csllFinanceira,
      creditosPisCofins: {
        insumos: f.creditoPisCofinsInsumos,
        energiaEletrica: f.creditoPisCofinsEnergia,
        alugueisPj: f.creditoPisCofinsAlugueis,
        fretesVenda: f.creditoPisCofinsFretes,
      },
      modo: 'anual_estimativa',
    },
    lucroPresumido: {
      receitas, folha, estadualMunicipal, retencoes,
      atividade: f.atividadePresumido,
    },
    simples: {
      receitas, anexo: f.anexoSimples, rbt12: f.rbt12, folha12m: f.folha12m,
    },
    reforma: {
      receitas,
      anoReferencia: f.anoReforma,
      regimeEspecialReducao: f.reducaoReforma,
      categoriaImpostoSeletivo: f.categoriaSeletivo,
    },
  };
}

export default function CalculadoraTributaria() {
  const [form, setForm] = useState<CampoInput>(DEFAULT_INPUT);
  const [regimeSelecionado, setRegimeSelecionado] = useState<string>('lucro_real');
  const [salvando, setSalvando] = useState(false);
  const [usarDadosReais, setUsarDadosReais] = useState(false);
  const { data: empresas = [] } = useAllEmpresas();
  const [empresaId, setEmpresaId] = useState<string | undefined>();
  const empresaSelecionada = empresas.find((e) => e.id === empresaId);

  const { data: dadosReais, isFetching: fetchingReais } = useCalculadoraDadosReais(empresaId, usarDadosReais);

  useEffect(() => {
    if (usarDadosReais && dadosReais) {
      setForm((p) => ({
        ...p,
        receitaBrutaAnual: dadosReais.receitaBrutaAnual || p.receitaBrutaAnual,
        folhaAnual: dadosReais.folhaAnual || p.folhaAnual,
        creditoPisCofinsInsumos: dadosReais.creditoPisCofinsInsumos || p.creditoPisCofinsInsumos,
        creditoIcmsCompras: dadosReais.creditoIcmsCompras || p.creditoIcmsCompras,
        rbt12: dadosReais.rbt12 || p.rbt12,
        folha12m: dadosReais.folha12m || p.folha12m,
      }));
      toast.success(
        `Dados aplicados: ${dadosReais.amostragem.contasReceber} recebimentos, ${dadosReais.amostragem.folhaLinhas} folhas, ${dadosReais.amostragem.nfeRecebidas} NF-e`,
      );
    }
  }, [usarDadosReais, dadosReais]);

  const update = <K extends keyof CampoInput>(k: K, v: CampoInput[K]) => setForm((p) => ({ ...p, [k]: v }));

  const resultado = useMemo(() => calcularTodosRegimes(buildInput(form)), [form]);
  const resultadoAtivo: ResultadoRegime | undefined = resultado.cenarios.find(
    (c) => c.regime === regimeSelecionado,
  ) ?? resultado.cenarios[0];

  function exportarPDF() {
    if (!resultadoAtivo) return;
    try {
      const blob = gerarPdfMemorialCalculo(resultado, resultadoAtivo, {
        nome: empresaSelecionada?.nome_fantasia ?? empresaSelecionada?.razao_social ?? 'Empresa',
        cnpj: empresaSelecionada?.cnpj,
        periodo: String(new Date().getFullYear()),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `memorial-tributario-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF gerado');
    } catch (e) {
      toast.error(`Falha ao gerar PDF: ${(e as Error).message}`);
    }
  }

  async function salvarCenario() {
    setSalvando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      const { data: empresas } = await supabase
        .from('user_empresas').select('empresa_id').eq('user_id', user.id).limit(1);
      const empresaId = empresas?.[0]?.empresa_id;
      if (!empresaId) throw new Error('Sem empresa vinculada');

      const cenariosResumo = resultado.cenarios.map((c) => ({
        regime: c.regime, nome: c.nome, totalAPagar: c.totalAPagar, cargaEfetiva: c.cargaEfetiva,
      }));
      const { error } = await supabase.from('regimes_simulados').insert({
        empresa_id: empresaId,
        created_by: user.id,
        ano_referencia: new Date().getFullYear(),
        regime_atual: resultadoAtivo?.regime ?? 'lucro_real',
        regime_recomendado: resultado.melhorCenario?.regime ?? (resultadoAtivo?.regime ?? 'lucro_real'),
        economia_anual_estimada: resultado.economiaAnualVsPior,
        rbt12: form.rbt12,
        folha_12m: form.folha12m,
        cenarios: cenariosResumo as unknown as import('@/integrations/supabase/types').Json,
        alertas: (resultadoAtivo?.alertas ?? []) as unknown as import('@/integrations/supabase/types').Json,
        parametros: {
          tipo_calculo: 'calculadora',
          inputs_completos: form,
          memoria_calculo: resultadoAtivo?.memoria ?? [],
          resultado_ativo: {
            regime: resultadoAtivo?.regime,
            totalTributos: resultadoAtivo?.totalTributos ?? 0,
            totalAPagar: resultadoAtivo?.totalAPagar ?? 0,
            cargaEfetiva: resultadoAtivo?.cargaEfetiva ?? 0,
          },
        } as unknown as import('@/integrations/supabase/types').Json,
      });
      if (error) throw error;
      toast.success('Cenário salvo com sucesso');
    } catch (e) {
      toast.error(`Falha ao salvar: ${(e as Error).message}`);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" /> Calculadora Tributária em Tempo Real
          </h1>
          <p className="text-sm text-muted-foreground">
            Simule Lucro Real, Presumido, Simples Nacional e Reforma Tributária (CBS/IBS) simultaneamente. Recálculo instantâneo.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setForm(DEFAULT_INPUT)}>
            <RefreshCw className="h-4 w-4 mr-2" /> Resetar
          </Button>
          <Button onClick={salvarCenario} disabled={salvando}>
            <Save className="h-4 w-4 mr-2" /> {salvando ? 'Salvando…' : 'Salvar cenário'}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* INPUTS */}
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Parâmetros</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={regimeSelecionado} onValueChange={setRegimeSelecionado}>
              <TabsList className="grid grid-cols-4 mb-3">
                <TabsTrigger value="simples_nacional">Simples</TabsTrigger>
                <TabsTrigger value="lucro_presumido">Presumido</TabsTrigger>
                <TabsTrigger value="lucro_real">Real</TabsTrigger>
                <TabsTrigger value="reforma">Reforma</TabsTrigger>
              </TabsList>

              {/* Comuns */}
              <Accordion type="multiple" defaultValue={['receitas']} className="w-full">
                <AccordionItem value="receitas">
                  <AccordionTrigger className="text-sm">Receitas & folha</AccordionTrigger>
                  <AccordionContent className="grid grid-cols-2 gap-3">
                    <NumberField label="Receita bruta anual" suffix="R$" value={form.receitaBrutaAnual} onChange={(v) => update('receitaBrutaAnual', v)} step={10000} />
                    <NumberField label="% Serviços" suffix="%" value={form.percentualServicos} onChange={(v) => update('percentualServicos', v)} step={1} />
                    <NumberField label="Folha anual" suffix="R$" value={form.folhaAnual} onChange={(v) => update('folhaAnual', v)} step={1000} />
                    <NumberField label="RAT" hint="0,01 a 0,03" value={form.aliquotaRat} onChange={(v) => update('aliquotaRat', v)} step={0.001} />
                    <NumberField label="Terceiros" hint="ex 0,058" value={form.aliquotaTerceiros} onChange={(v) => update('aliquotaTerceiros', v)} step={0.001} />
                    <NumberField label="Alíq. ICMS" value={form.aliquotaIcms} onChange={(v) => update('aliquotaIcms', v)} step={0.01} />
                    <NumberField label="Alíq. ISS" value={form.aliquotaIss} onChange={(v) => update('aliquotaIss', v)} step={0.001} />
                    <NumberField label="Créditos ICMS (compras)" suffix="R$" value={form.creditoIcmsCompras} onChange={(v) => update('creditoIcmsCompras', v)} step={1000} />
                  </AccordionContent>
                </AccordionItem>

                <TabsContent value="lucro_real" className="mt-0">
                  <AccordionItem value="lalur">
                    <AccordionTrigger className="text-sm">LALUR & prejuízo</AccordionTrigger>
                    <AccordionContent className="grid grid-cols-2 gap-3">
                      <NumberField label="Lucro contábil (LAIR)" suffix="R$" value={form.lucroContabil} onChange={(v) => update('lucroContabil', v)} step={10000} />
                      <NumberField label="Prejuízo fiscal acumulado" suffix="R$" value={form.prejuizoAcumulado} onChange={(v) => update('prejuizoAcumulado', v)} step={10000} />
                      <NumberField label="Total adições" suffix="R$" value={form.adicoesLalur} onChange={(v) => update('adicoesLalur', v)} step={1000} hint="Multas, brindes, doações" />
                      <NumberField label="Total exclusões" suffix="R$" value={form.exclusoesLalur} onChange={(v) => update('exclusoesLalur', v)} step={1000} hint="Dividendos, incentivos" />
                      <div className="col-span-2 flex items-center justify-between rounded-md border border-border p-2">
                        <Label className="text-xs">CSLL 15% (financeira)</Label>
                        <Switch checked={form.csllFinanceira} onCheckedChange={(v) => update('csllFinanceira', v)} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="creditos">
                    <AccordionTrigger className="text-sm">Créditos PIS/COFINS</AccordionTrigger>
                    <AccordionContent className="grid grid-cols-2 gap-3">
                      <NumberField label="Insumos" suffix="R$" value={form.creditoPisCofinsInsumos} onChange={(v) => update('creditoPisCofinsInsumos', v)} step={10000} />
                      <NumberField label="Energia elétrica" suffix="R$" value={form.creditoPisCofinsEnergia} onChange={(v) => update('creditoPisCofinsEnergia', v)} step={1000} />
                      <NumberField label="Aluguéis PJ" suffix="R$" value={form.creditoPisCofinsAlugueis} onChange={(v) => update('creditoPisCofinsAlugueis', v)} step={1000} />
                      <NumberField label="Fretes na venda" suffix="R$" value={form.creditoPisCofinsFretes} onChange={(v) => update('creditoPisCofinsFretes', v)} step={1000} />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="retencoes">
                    <AccordionTrigger className="text-sm">Retenções na fonte</AccordionTrigger>
                    <AccordionContent className="grid grid-cols-2 gap-3">
                      <NumberField label="IRRF sofrido" suffix="R$" value={form.irrfSofrido} onChange={(v) => update('irrfSofrido', v)} step={100} />
                      <NumberField label="CSRF 4,65%" suffix="R$" value={form.csrfSofrido} onChange={(v) => update('csrfSofrido', v)} step={100} />
                    </AccordionContent>
                  </AccordionItem>
                </TabsContent>

                <TabsContent value="lucro_presumido" className="mt-0 space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Atividade</Label>
                    <Select value={form.atividadePresumido} onValueChange={(v) => update('atividadePresumido', v as CampoInput['atividadePresumido'])}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comercio">Comércio (8% IRPJ / 12% CSLL)</SelectItem>
                        <SelectItem value="industria">Indústria (8% / 12%)</SelectItem>
                        <SelectItem value="servicos_geral">Serviços em geral (32%)</SelectItem>
                        <SelectItem value="transporte_cargas">Transporte de cargas (8% / 12%)</SelectItem>
                        <SelectItem value="servicos_hospitalares">Serviços hospitalares (8% / 12%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="simples_nacional" className="mt-0 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs text-muted-foreground">Anexo</Label>
                      <Select value={form.anexoSimples} onValueChange={(v) => update('anexoSimples', v as CampoInput['anexoSimples'])}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="I">Anexo I — Comércio</SelectItem>
                          <SelectItem value="II">Anexo II — Indústria</SelectItem>
                          <SelectItem value="III">Anexo III — Serviços (Fator R aplicável)</SelectItem>
                          <SelectItem value="IV">Anexo IV — Serviços específicos</SelectItem>
                          <SelectItem value="V">Anexo V — Serviços (Fator R aplicável)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <NumberField label="RBT12" suffix="R$" value={form.rbt12} onChange={(v) => update('rbt12', v)} step={10000} />
                    <NumberField label="Folha 12m" suffix="R$" value={form.folha12m} onChange={(v) => update('folha12m', v)} step={1000} />
                  </div>
                </TabsContent>

                <TabsContent value="reforma" className="mt-0 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <NumberField label="Ano de referência" value={form.anoReforma} onChange={(v) => update('anoReforma', v)} step={1} hint="2026..2033+" />
                    <NumberField label="Redução regime especial" value={form.reducaoReforma} onChange={(v) => update('reducaoReforma', v)} step={0.1} hint="0=0% .. 1=100%" />
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs text-muted-foreground">Categoria Imposto Seletivo</Label>
                      <Select value={form.categoriaSeletivo} onValueChange={(v) => update('categoriaSeletivo', v as CampoInput['categoriaSeletivo'])}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nenhum">Nenhum</SelectItem>
                          <SelectItem value="bebidas_alcoolicas">Bebidas alcoólicas</SelectItem>
                          <SelectItem value="fumo">Fumo</SelectItem>
                          <SelectItem value="veiculos">Veículos</SelectItem>
                          <SelectItem value="bens_luxo">Bens de luxo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              </Accordion>
            </Tabs>
          </CardContent>
        </Card>

        {/* RESULTADO */}
        <div className="lg:col-span-5 space-y-4">
          {resultadoAtivo && <ResultadoBreakdown resultado={resultadoAtivo} />}
          {resultadoAtivo && <MemoriaCalculo resultado={resultadoAtivo} />}
        </div>

        {/* COMPARATIVO */}
        <div className="lg:col-span-3">
          <ComparativoRegimes resultado={resultado} />
        </div>
      </div>
    </div>
  );
}
