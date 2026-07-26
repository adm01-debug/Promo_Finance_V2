import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarCheck, Download, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEmpresaScope } from '@/contexts/EmpresaScopeContext';
import {
  chaveEntrega,
  useEntregasObrigacoes,
  useRegistrarEntregaObrigacao,
} from '@/hooks/useEntregasObrigacoes';
import {
  OBRIGACOES,
  analisarTendencia,
  calcularConformidade,
  construirHistorico,
  calcularMultaAtraso,
  chaveItem,
  competenciasAoRedor,
  exportarCalendarioCsv,
  gerarCalendario,
  type ItemCalendario,
  type RegimeAplicavel,
  type SituacaoObrigacao,
} from '@/lib/tributario/obrigacoes';
import { ConformidadeCard } from '@/components/tributario/ConformidadeCard';
import { ConformidadeHistoricoCard } from '@/components/tributario/ConformidadeHistoricoCard';
import {
  useConformidadeSnapshots,
  useSalvarConformidadeSnapshots,
} from '@/hooks/useConformidadeSnapshots';


const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataBR = (iso: string) => (iso.length === 10 ? iso.split('-').reverse().join('/') : iso);
const num = (v: string) => {
  const parsed = Number(v.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

const SITUACAO_LABEL: Record<SituacaoObrigacao, string> = {
  entregue: 'Entregue',
  vencida: 'Vencida',
  vence_hoje: 'Vence hoje',
  proxima: 'Próxima',
  futura: 'Futura',
};

const SITUACAO_VARIANT: Record<SituacaoObrigacao, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  entregue: 'secondary',
  vencida: 'destructive',
  vence_hoje: 'destructive',
  proxima: 'default',
  futura: 'outline',
};

export default function ObrigacoesAcessorias() {
  const hojeISO = new Date().toISOString().slice(0, 10);
  const [regime, setRegime] = useState<RegimeAplicavel>('real');
  const [referencia, setReferencia] = useState(hojeISO.slice(0, 7));
  const [hoje, setHoje] = useState(hojeISO);

  const [multaObrigacao, setMultaObrigacao] = useState(OBRIGACOES[0].id);
  const [multaPrazo, setMultaPrazo] = useState(hojeISO);
  const [multaEntrega, setMultaEntrega] = useState(hojeISO);
  const [multaBase, setMultaBase] = useState(0);

  const { currentEmpresaId } = useEmpresaScope();

  const competencias = useMemo(
    () => (/^\d{4}-\d{2}$/.test(referencia) ? competenciasAoRedor(referencia, 6, 6) : []),
    [referencia]
  );

  const { data: entregas = [], isLoading: carregandoEntregas } =
    useEntregasObrigacoes(competencias);
  const registrar = useRegistrarEntregaObrigacao();

  /** Índice das entregas persistidas por obrigação+competência. */
  const entregasPorChave = useMemo(() => {
    const mapa = new Map<string, (typeof entregas)[number]>();
    for (const e of entregas) mapa.set(chaveEntrega(e.obrigacao_id, e.competencia), e);
    return mapa;
  }, [entregas]);

  /** Conjunto de chaves entregues no formato esperado pelo motor do calendário. */
  const entregues = useMemo(() => {
    const set = new Set<string>();
    for (const e of entregas) {
      if (e.status === 'entregue' || e.status === 'dispensada') {
        set.add(chaveItem(e.obrigacao_id, e.competencia));
      }
    }
    return set;
  }, [entregas]);

  const itens = useMemo<ItemCalendario[]>(() => {
    if (competencias.length === 0) return [];
    return gerarCalendario({ competencias, regime, hoje, entregues });
  }, [competencias, regime, hoje, entregues]);

  const resumo = useMemo(() => {
    const contar = (s: SituacaoObrigacao) => itens.filter((i) => i.situacao === s).length;
    return {
      total: itens.length,
      vencidas: contar('vencida'),
      proximas: contar('proxima') + contar('vence_hoje'),
      entregues: contar('entregue'),
    };
  }, [itens]);

  /** Registros de entrega normalizados para o motor de conformidade (J e K). */
  const registrosConformidade = useMemo(
    () =>
      entregas.map((e) => ({
        obrigacaoId: e.obrigacao_id,
        competencia: e.competencia,
        status: e.status,
        dataEntrega: e.data_entrega,
        valorMulta: e.valor_multa,
      })),
    [entregas]
  );

  /** Etapa J — score de conformidade fiscal do período em tela. */
  const conformidade = useMemo(
    () => calcularConformidade(itens, registrosConformidade),
    [itens, registrosConformidade]
  );

  const salvarSnapshots = useSalvarConformidadeSnapshots();

  /** Etapa K — série histórica e tendência do score. */
  const analiseHistorico = useMemo(
    () => analisarTendencia(construirHistorico(itens, registrosConformidade)),
    [itens, registrosConformidade]
  );




  const multa = useMemo(() => {
    try {
      return calcularMultaAtraso({
        obrigacaoId: multaObrigacao,
        prazo: multaPrazo,
        dataEntrega: multaEntrega,
        baseCalculo: multaBase,
      });
    } catch {
      return null;
    }
  }, [multaObrigacao, multaPrazo, multaEntrega, multaBase]);

  /**
   * Alterna a situação de entrega persistindo no banco. Quando marcada,
   * calcula automaticamente a multa por atraso caso a entrega ocorra
   * após o prazo legal (base zerada — piso da obrigação é aplicado).
   */
  const alternarEntrega = (item: ItemCalendario) => {
    if (!currentEmpresaId) {
      toast.error('Selecione uma empresa para controlar as entregas.');
      return;
    }
    const registro = entregasPorChave.get(chaveEntrega(item.obrigacaoId, item.competencia));
    const marcando = registro?.status !== 'entregue';

    let valorMulta = 0;
    if (marcando && hoje > item.prazo) {
      try {
        valorMulta = calcularMultaAtraso({
          obrigacaoId: item.obrigacaoId,
          prazo: item.prazo,
          dataEntrega: hoje,
          baseCalculo: 0,
        }).valorDevido;
      } catch {
        valorMulta = 0;
      }
    }

    registrar.mutate(
      {
        obrigacaoId: item.obrigacaoId,
        competencia: item.competencia,
        prazo: item.prazo,
        status: marcando ? 'entregue' : 'pendente',
        dataEntrega: marcando ? hoje : null,
        protocolo: registro?.protocolo ?? null,
        valorMulta,
      },
      {
        onSuccess: () =>
          toast.success(
            marcando
              ? `${item.nome} ${item.competencia} registrada como entregue.`
              : `${item.nome} ${item.competencia} voltou para pendente.`
          ),
      }
    );
  };


  const baixarCsv = () => {
    const blob = new Blob([exportarCalendarioCsv(itens)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `obrigacoes-acessorias-${hoje}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        <div className="container relative z-10 mx-auto space-y-6 p-4 md:p-6">
          <PageHeader
            title="Obrigações Acessórias"
            subtitle="Calendário fiscal determinístico com prazos em dia útil, controle de entregas e cálculo de multa por atraso."
            badge="Etapa H"
            icon={CalendarCheck}
            gradientFrom="from-primary/80"
            gradientVia="via-primary"
            gradientTo="to-success"
          />

          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: 'Obrigações no período', valor: resumo.total },
              { label: 'Vencidas', valor: resumo.vencidas },
              { label: 'Vencendo em 7 dias', valor: resumo.proximas },
              { label: 'Entregues', valor: resumo.entregues },
            ].map((card) => (
              <Card key={card.label}>
                <CardHeader className="pb-2">
                  <CardDescription>{card.label}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold text-foreground">{card.valor}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <ConformidadeCard resultado={conformidade} />

          <ConformidadeHistoricoCard
            analise={analiseHistorico}
            salvando={salvarSnapshots.isPending}
            onSalvar={() => salvarSnapshots.mutate(analiseHistorico.pontos)}

          <ProjecaoConformidadeCard pontos={analiseHistorico.pontos} horizonte={3} />





          <Card>
            <CardHeader>
              <CardTitle>Parâmetros</CardTitle>
              <CardDescription>Regime, competência de referência e data-base da análise.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="regime">Regime tributário</Label>
                <Select value={regime} onValueChange={(v) => setRegime(v as RegimeAplicavel)}>
                  <SelectTrigger id="regime">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simples">Simples Nacional</SelectItem>
                    <SelectItem value="presumido">Lucro Presumido</SelectItem>
                    <SelectItem value="real">Lucro Real</SelectItem>
                    <SelectItem value="todos">Todos (visão completa)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="referencia">Competência de referência</Label>
                <Input
                  id="referencia"
                  type="month"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hoje">Data-base</Label>
                <Input id="hoje" type="date" value={hoje} onChange={(e) => setHoje(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={baixarCsv} disabled={itens.length === 0}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="calendario">
            <TabsList>
              <TabsTrigger value="calendario">Calendário</TabsTrigger>
              <TabsTrigger value="catalogo">Catálogo legal</TabsTrigger>
              <TabsTrigger value="multa">Multa por atraso</TabsTrigger>
            </TabsList>

            <TabsContent value="calendario" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Prazos de 6 meses antes a 6 meses depois</CardTitle>
                  <CardDescription>
                    Prazos ajustados para dia útil bancário (feriados fixos e móveis considerados).
                    Entregas marcadas são persistidas no banco por empresa e competência.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!currentEmpresaId && (
                    <Alert className="mb-4">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Selecione uma empresa no seletor superior para registrar e consultar entregas.
                      </AlertDescription>
                    </Alert>
                  )}
                  {itens.length === 0 ? (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>Informe uma competência válida para gerar o calendário.</AlertDescription>
                    </Alert>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">OK</TableHead>
                          <TableHead>Obrigação</TableHead>
                          <TableHead>Órgão</TableHead>
                          <TableHead>Competência</TableHead>
                          <TableHead>Prazo</TableHead>
                          <TableHead className="text-right">Dias</TableHead>
                          <TableHead>Situação</TableHead>
                          <TableHead>Registro</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itens.map((item) => {
                          const registro = entregasPorChave.get(
                            chaveEntrega(item.obrigacaoId, item.competencia)
                          );
                          return (
                            <TableRow key={chaveItem(item.obrigacaoId, item.competencia)}>
                              <TableCell>
                                {carregandoEntregas || registrar.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                ) : (
                                  <Checkbox
                                    checked={item.situacao === 'entregue'}
                                    disabled={!currentEmpresaId}
                                    onChange={() => alternarEntrega(item)}
                                    aria-label={`Marcar ${item.nome} de ${item.competencia} como entregue`}
                                  />
                                )}
                              </TableCell>
                              <TableCell className="font-medium text-foreground">{item.nome}</TableCell>
                              <TableCell className="text-muted-foreground">{item.orgao}</TableCell>
                              <TableCell>{item.competencia}</TableCell>
                              <TableCell>{dataBR(item.prazo)}</TableCell>
                              <TableCell className="text-right tabular-nums">{item.diasRestantes}</TableCell>
                              <TableCell>
                                <Badge variant={SITUACAO_VARIANT[item.situacao]}>
                                  {SITUACAO_LABEL[item.situacao]}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {registro?.data_entrega ? (
                                  <span>
                                    {dataBR(registro.data_entrega)}
                                    {registro.valor_multa > 0 ? ` · multa ${brl(registro.valor_multa)}` : ''}
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>

              </Card>
            </TabsContent>

            <TabsContent value="catalogo" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Catálogo de obrigações</CardTitle>
                  <CardDescription>Base legal, periodicidade e regra de multa por obrigação.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Obrigação</TableHead>
                        <TableHead>Periodicidade</TableHead>
                        <TableHead>Regimes</TableHead>
                        <TableHead>Base legal</TableHead>
                        <TableHead className="text-right">Multa mín.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {OBRIGACOES.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell>
                            <p className="font-medium text-foreground">{o.nome}</p>
                            <p className="text-xs text-muted-foreground">{o.descricao}</p>
                          </TableCell>
                          <TableCell className="capitalize">{o.periodicidade}</TableCell>
                          <TableCell className="text-muted-foreground">{o.regimes.join(', ')}</TableCell>
                          <TableCell className="text-muted-foreground">{o.baseLegal}</TableCell>
                          <TableCell className="text-right tabular-nums">{brl(o.multaMinima)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="multa" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Simulador de multa por entrega em atraso</CardTitle>
                  <CardDescription>
                    Multa por mês-calendário ou fração, com piso e teto por obrigação (MP 2.158-35/2001, art. 57).
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="multa-obrigacao">Obrigação</Label>
                      <Select value={multaObrigacao} onValueChange={setMultaObrigacao}>
                        <SelectTrigger id="multa-obrigacao">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OBRIGACOES.map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {o.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="multa-prazo">Prazo legal</Label>
                        <Input
                          id="multa-prazo"
                          type="date"
                          value={multaPrazo}
                          onChange={(e) => setMultaPrazo(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="multa-entrega">Data de entrega</Label>
                        <Input
                          id="multa-entrega"
                          type="date"
                          value={multaEntrega}
                          onChange={(e) => setMultaEntrega(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="multa-base">Base de cálculo (faturamento ou tributos declarados)</Label>
                      <Input
                        id="multa-base"
                        inputMode="decimal"
                        defaultValue="0"
                        onChange={(e) => setMultaBase(num(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-card p-4">
                    {multa ? (
                      <dl className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Dias em atraso</dt>
                          <dd className="tabular-nums text-foreground">{multa.diasAtraso}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Meses (ou fração)</dt>
                          <dd className="tabular-nums text-foreground">{multa.mesesAtraso}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Percentual aplicado</dt>
                          <dd className="tabular-nums text-foreground">
                            {(multa.percentual * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%
                          </dd>
                        </div>
                        <div className="flex justify-between border-t border-border pt-3">
                          <dt className="font-medium text-foreground">Multa devida</dt>
                          <dd className="font-semibold tabular-nums text-foreground">{brl(multa.valorDevido)}</dd>
                        </div>
                        {(multa.aplicouPiso || multa.aplicouTeto) && (
                          <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                              {multa.aplicouTeto ? 'Teto percentual atingido. ' : ''}
                              {multa.aplicouPiso ? 'Valor ajustado ao piso legal da obrigação.' : ''}
                            </AlertDescription>
                          </Alert>
                        )}
                      </dl>
                    ) : (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>Preencha datas válidas para simular a multa.</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
