import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Landmark } from 'lucide-react';
import {
  MODELOS_AJUSTE,
  PRESUNCAO_CSLL,
  PRESUNCAO_IRPJ,
  apurarIrpjCsll,
} from '@/lib/tributario/irpj-csll';
import type {
  AtividadePresuncao,
  FormaApuracao,
  PeriodoApuracao,
} from '@/lib/tributario/irpj-csll';
import { formatCurrency } from '@/lib/formatters';
import type { LinhaPeriodo } from './IrpjCsllLucroReal.types';
import { novoPeriodo, pct } from './IrpjCsllLucroReal.helpers';
import { IrpjCsllLucroRealApuracao } from './IrpjCsllLucroRealApuracao';

export default function IrpjCsllLucroReal() {
  const [forma, setForma] = useState<FormaApuracao>('trimestral');
  const [atividade, setAtividade] = useState<AtividadePresuncao>('comercio_industria');
  const [prejuizoInicial, setPrejuizoInicial] = useState(0);
  const [baseNegativaInicial, setBaseNegativaInicial] = useState(0);
  const [periodos, setPeriodos] = useState<LinhaPeriodo[]>([novoPeriodo('1º Trimestre')]);

  const atualizar = (id: string, patch: Partial<LinhaPeriodo>) =>
    setPeriodos((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const adicionarAjuste = (periodoId: string, modeloIdx: number) => {
    const modelo = MODELOS_AJUSTE[modeloIdx];
    if (!modelo) return;
    setPeriodos((prev) =>
      prev.map((p) =>
        p.id === periodoId
          ? {
              ...p,
              ajustes: [
                ...p.ajustes,
                {
                  id: crypto.randomUUID(),
                  descricao: modelo.descricao,
                  tipo: modelo.tipo,
                  alvo: modelo.alvo,
                  valor: 0,
                  fundamento: modelo.fundamento,
                },
              ],
            }
          : p
      )
    );
  };

  const atualizarAjuste = (periodoId: string, ajusteId: string, valor: number) =>
    setPeriodos((prev) =>
      prev.map((p) =>
        p.id === periodoId
          ? { ...p, ajustes: p.ajustes.map((a) => (a.id === ajusteId ? { ...a, valor } : a)) }
          : p
      )
    );

  const removerAjuste = (periodoId: string, ajusteId: string) =>
    setPeriodos((prev) =>
      prev.map((p) =>
        p.id === periodoId ? { ...p, ajustes: p.ajustes.filter((a) => a.id !== ajusteId) } : p
      )
    );

  const resultado = useMemo(() => {
    const entrada: PeriodoApuracao[] = periodos.map((p) => ({
      rotulo: p.rotulo,
      lucroLiquido: p.lucroLiquido,
      ajustes: p.ajustes,
      irrfCompensavel: p.irrf,
      csllRetidaCompensavel: p.csllRetida,
      receitaBruta: p.receitaBruta,
      percentualPresuncaoIrpj: PRESUNCAO_IRPJ[atividade],
      percentualPresuncaoCsll: PRESUNCAO_CSLL[atividade],
      meses: forma === 'trimestral' ? 3 : 1,
    }));
    return apurarIrpjCsll({
      forma,
      periodos: entrada,
      saldosIniciais: { prejuizoFiscal: prejuizoInicial, baseNegativaCsll: baseNegativaInicial },
    });
  }, [periodos, forma, atividade, prejuizoInicial, baseNegativaInicial]);

  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        <div className="container relative z-10 mx-auto space-y-6 p-4 md:p-6">
          <PageHeader
            title="IRPJ/CSLL — Lucro Real"
            subtitle="Apuração trimestral ou anual por estimativa, com LALUR Parte A (adições/exclusões) e Parte B (prejuízo fiscal e base negativa)."
            badge="Etapa F"
            icon={Landmark}
            gradientFrom="from-primary/80"
            gradientVia="via-primary"
            gradientTo="to-success"
          />

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>IRPJ a recolher</CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {formatCurrency(resultado.totalIrpj)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>CSLL a recolher</CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {formatCurrency(resultado.totalCsll)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total do período</CardDescription>
                <CardTitle className="text-2xl tabular-nums text-primary">
                  {formatCurrency(resultado.totalARecolher)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Carga efetiva sobre receita</CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {pct(resultado.cargaEfetiva)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {resultado.alertas.length > 0 && (
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc pl-4 text-sm">
                  {resultado.alertas.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <IrpjCsllLucroRealApuracao
            forma={forma}
            setForma={setForma}
            atividade={atividade}
            setAtividade={setAtividade}
            setPrejuizoInicial={setPrejuizoInicial}
            setBaseNegativaInicial={setBaseNegativaInicial}
            periodos={periodos}
            setPeriodos={setPeriodos}
            atualizar={atualizar}
            adicionarAjuste={adicionarAjuste}
            atualizarAjuste={atualizarAjuste}
            removerAjuste={removerAjuste}
            resultado={resultado}
          />
        </div>
      </div>
    </MainLayout>
  );
}
