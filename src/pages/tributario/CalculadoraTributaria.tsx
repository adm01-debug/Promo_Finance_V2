import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calculator, Save, RefreshCw, FileDown, Database } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { calcularTodosRegimes, type ResultadoRegime } from '@/lib/tributario/calculadora';
import { derivarAtividadePresumido, normalizarCnae } from '@/lib/tributario/calculadora/atividade-cnae';
import { ResultadoBreakdown } from '@/components/tributario/calculadora/ResultadoBreakdown';
import { MemoriaCalculo } from '@/components/tributario/calculadora/MemoriaCalculo';
import { ComparativoRegimes } from '@/components/tributario/calculadora/ComparativoRegimes';
import { HistoricoCenariosCalculadora } from '@/components/tributario/calculadora/HistoricoCenariosCalculadora';
import { useCalculadoraDadosReais } from '@/hooks/useCalculadoraDadosReais';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import { gerarPdfMemorialCalculo } from '@/lib/tributario/relatorio-pdf/memorial';
import { ParametrosCard } from './CalculadoraTributaria.parts';
import { DEFAULT_INPUT, buildInput, type CampoInput } from './CalculadoraTributaria.helpers';

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

  /**
   * O CNAE preponderante da empresa selecionada alimenta a derivação de presunção.
   * Só sobrescreve enquanto o usuário não tiver digitado um CNAE manualmente
   * (rastreado por `cnaeManual`), preservando a intenção explícita do operador.
   */
  const [cnaeManual, setCnaeManual] = useState(false);
  const cnaeEmpresa = empresaSelecionada?.cnae_principal ?? '';
  useEffect(() => {
    if (cnaeManual) return;
    setForm((p) => (p.cnaePreponderante === cnaeEmpresa ? p : { ...p, cnaePreponderante: cnaeEmpresa }));
  }, [cnaeEmpresa, cnaeManual]);

  const update = <K extends keyof CampoInput>(k: K, v: CampoInput[K]) => setForm((p) => ({ ...p, [k]: v }));


  /**
   * Quando o CNAE preponderante é válido, a atividade presumida é derivada dele
   * (Lei 9.249/95, arts. 15 e 20), eliminando erro de seleção manual.
   */
  const atividadeDerivada = useMemo(
    () => (normalizarCnae(form.cnaePreponderante) ? derivarAtividadePresumido(form.cnaePreponderante) : null),
    [form.cnaePreponderante],
  );

  const resultado = useMemo(
    () => calcularTodosRegimes(buildInput(form, atividadeDerivada?.atividade)),
    [form, atividadeDerivada],
  );

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
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={empresaId} onValueChange={setEmpresaId}>
            <SelectTrigger className="w-52 h-9"><SelectValue placeholder="Selecionar empresa" /></SelectTrigger>
            <SelectContent>
              {empresas.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.nome_fantasia ?? e.razao_social}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5">
            <Database className="h-3.5 w-3.5 text-muted-foreground" />
            <Label className="text-xs">Usar dados reais</Label>
            <Switch checked={usarDadosReais} onCheckedChange={setUsarDadosReais} disabled={!empresaId || fetchingReais} />
          </div>
          <Button variant="outline" size="sm" onClick={() => setForm(DEFAULT_INPUT)}>
            <RefreshCw className="h-4 w-4 mr-2" /> Resetar
          </Button>
          <Button variant="outline" size="sm" onClick={exportarPDF}>
            <FileDown className="h-4 w-4 mr-2" /> PDF
          </Button>
          <Button size="sm" onClick={salvarCenario} disabled={salvando}>
            <Save className="h-4 w-4 mr-2" /> {salvando ? 'Salvando…' : 'Salvar cenário'}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <ParametrosCard
          form={form}
          update={update}
          regimeSelecionado={regimeSelecionado}
          onRegimeChange={setRegimeSelecionado}
          cnaeManual={cnaeManual}
          setCnaeManual={setCnaeManual}
          cnaeEmpresa={cnaeEmpresa}
          atividadeDerivada={atividadeDerivada}
        />

        {/* RESULTADO */}
        <div className="lg:col-span-5 space-y-4">
          {resultadoAtivo && <ResultadoBreakdown resultado={resultadoAtivo} />}
          {resultadoAtivo && <MemoriaCalculo resultado={resultadoAtivo} />}
        </div>

        {/* COMPARATIVO + HISTÓRICO */}
        <div className="lg:col-span-3 space-y-4">
          <ComparativoRegimes resultado={resultado} />
          <HistoricoCenariosCalculadora empresaId={empresaId} />
        </div>
      </div>
    </div>
  );
}
