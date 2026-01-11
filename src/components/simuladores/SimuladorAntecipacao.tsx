import { useState, useMemo } from 'react';
import { TrendingUp, Calculator, Calendar, DollarSign, Percent, Info, Building2, ArrowRight, CheckCircle2, Star, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/formatters';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface RecebiveisDisponiveis {
  id: string;
  cliente_nome: string;
  valor: number;
  data_vencimento: string;
  diasParaVencimento: number;
}

interface InstituicaoFinanceira {
  id: string;
  nome: string;
  logo: string;
  taxaMensal: number;
  prazoAprovacao: string;
  limiteMin: number;
  limiteMax: number;
  rating: number;
  destaque?: boolean;
}

interface SimulacaoResultado {
  instituicao: InstituicaoFinanceira;
  valorBruto: number;
  taxaTotal: number;
  valorLiquido: number;
  economia: number;
  diasMedio: number;
  taxaEfetiva: number;
}

// Instituições parceiras simuladas
const INSTITUICOES: InstituicaoFinanceira[] = [
  { id: '1', nome: 'Banco Digital', logo: '🏦', taxaMensal: 1.89, prazoAprovacao: '2h', limiteMin: 1000, limiteMax: 500000, rating: 4.8, destaque: true },
  { id: '2', nome: 'FinTech Capital', logo: '💳', taxaMensal: 2.15, prazoAprovacao: '4h', limiteMin: 500, limiteMax: 200000, rating: 4.6 },
  { id: '3', nome: 'Crédito Express', logo: '⚡', taxaMensal: 2.49, prazoAprovacao: '1h', limiteMin: 100, limiteMax: 100000, rating: 4.4 },
  { id: '4', nome: 'Factoring Prime', logo: '🏢', taxaMensal: 1.75, prazoAprovacao: '24h', limiteMin: 10000, limiteMax: 2000000, rating: 4.9 },
  { id: '5', nome: 'Antecipa Já', logo: '🚀', taxaMensal: 2.99, prazoAprovacao: '30min', limiteMin: 50, limiteMax: 50000, rating: 4.2 },
];

export function SimuladorAntecipacao() {
  const [taxaPersonalizada, setTaxaPersonalizada] = useState(2.5);
  const [recebivelSelecionados, setRecebivelSelecionados] = useState<string[]>([]);
  const [dataAntecipacao, setDataAntecipacao] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [instituicaoSelecionada, setInstituicaoSelecionada] = useState<string | null>(null);
  const [modoComparacao, setModoComparacao] = useState<'instituicoes' | 'personalizado'>('instituicoes');

  // Buscar recebíveis pendentes
  const { data: recebiveis = [] } = useQuery({
    queryKey: ['recebiveis-para-antecipacao'],
    queryFn: async () => {
      const hoje = new Date();
      const { data, error } = await supabase
        .from('contas_receber')
        .select('id, cliente_nome, valor, data_vencimento')
        .in('status', ['pendente'])
        .gt('data_vencimento', format(hoje, 'yyyy-MM-dd'))
        .order('data_vencimento', { ascending: true });

      if (error) throw error;

      return (data || []).map(r => ({
        ...r,
        diasParaVencimento: differenceInDays(new Date(r.data_vencimento), hoje)
      })) as RecebiveisDisponiveis[];
    }
  });

  const toggleRecebivel = (id: string) => {
    setRecebivelSelecionados(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const selecionarTodos = () => {
    setRecebivelSelecionados(
      recebivelSelecionados.length === recebiveis.length 
        ? [] 
        : recebiveis.map(r => r.id)
    );
  };

  const calcularSimulacao = (taxa: number): Omit<SimulacaoResultado, 'instituicao'> | null => {
    const selecionados = recebiveis.filter(r => recebivelSelecionados.includes(r.id));
    if (selecionados.length === 0) return null;

    const valorBruto = selecionados.reduce((sum, r) => sum + r.valor, 0);
    const hoje = new Date(dataAntecipacao);
    
    let taxaTotal = 0;
    let diasPonderados = 0;

    selecionados.forEach(r => {
      const diasAntecipados = differenceInDays(new Date(r.data_vencimento), hoje);
      const taxaProRata = (taxa / 100) * (diasAntecipados / 30);
      taxaTotal += r.valor * taxaProRata;
      diasPonderados += diasAntecipados * r.valor;
    });

    const diasMedio = valorBruto > 0 ? diasPonderados / valorBruto : 0;
    const valorLiquido = valorBruto - taxaTotal;
    const taxaEfetiva = valorBruto > 0 ? (taxaTotal / valorBruto) * 100 : 0;
    
    const taxaEmprestimo = 4;
    const custoEmprestimo = valorBruto * (taxaEmprestimo / 100) * (diasMedio / 30);
    const economia = custoEmprestimo - taxaTotal;

    return {
      valorBruto,
      taxaTotal,
      valorLiquido,
      economia: Math.max(0, economia),
      diasMedio: Math.round(diasMedio),
      taxaEfetiva
    };
  };

  const simulacoesInstituicoes = useMemo((): SimulacaoResultado[] => {
    const selecionados = recebiveis.filter(r => recebivelSelecionados.includes(r.id));
    if (selecionados.length === 0) return [];

    const valorBruto = selecionados.reduce((sum, r) => sum + r.valor, 0);

    return INSTITUICOES
      .filter(inst => valorBruto >= inst.limiteMin && valorBruto <= inst.limiteMax)
      .map(inst => {
        const sim = calcularSimulacao(inst.taxaMensal);
        if (!sim) return null;
        return { ...sim, instituicao: inst };
      })
      .filter((s): s is SimulacaoResultado => s !== null)
      .sort((a, b) => b.valorLiquido - a.valorLiquido);
  }, [recebiveis, recebivelSelecionados, dataAntecipacao]);

  const simulacaoPersonalizada = useMemo(() => {
    return calcularSimulacao(taxaPersonalizada);
  }, [recebiveis, recebivelSelecionados, taxaPersonalizada, dataAntecipacao]);

  const melhorOpcao = simulacoesInstituicoes[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Simulador de Antecipação de Recebíveis
        </CardTitle>
        <CardDescription>
          Compare taxas entre instituições e encontre a melhor opção
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configurações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Data da Antecipação
            </Label>
            <Input
              type="date"
              value={dataAntecipacao}
              onChange={(e) => setDataAntecipacao(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          <div className="space-y-2">
            <Label>Selecionar Recebíveis</Label>
            <Button variant="outline" size="sm" onClick={selecionarTodos} className="w-full">
              {recebivelSelecionados.length === recebiveis.length ? 'Desmarcar Todos' : `Selecionar Todos (${recebiveis.length})`}
            </Button>
          </div>
        </div>

        {/* Lista de Recebíveis */}
        {recebiveis.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum recebível disponível para antecipação</p>
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-2 rounded-lg border p-2">
            {recebiveis.map(rec => {
              const selecionado = recebivelSelecionados.includes(rec.id);
              return (
                <div
                  key={rec.id}
                  className={`p-2 rounded-lg cursor-pointer transition-colors ${
                    selecionado ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                  } border`}
                  onClick={() => toggleRecebivel(rec.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{rec.cliente_nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(rec.data_vencimento), "dd/MM/yy")} ({rec.diasParaVencimento}d)
                      </p>
                    </div>
                    <p className="font-semibold">{formatCurrency(rec.valor)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {recebivelSelecionados.length > 0 && (
          <>
            <Separator />

            <Tabs value={modoComparacao} onValueChange={(v) => setModoComparacao(v as 'instituicoes' | 'personalizado')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="instituicoes">
                  <Building2 className="h-4 w-4 mr-2" />
                  Comparar Instituições
                </TabsTrigger>
                <TabsTrigger value="personalizado">
                  <Calculator className="h-4 w-4 mr-2" />
                  Taxa Personalizada
                </TabsTrigger>
              </TabsList>

              <TabsContent value="instituicoes" className="mt-4 space-y-4">
                {melhorOpcao && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-gradient-to-r from-emerald-500/10 to-primary/10 border border-emerald-500/30"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-5 w-5 text-emerald-500" />
                      <span className="font-semibold text-emerald-700">Melhor Opção</span>
                      <Badge variant="secondary">{melhorOpcao.instituicao.nome}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Valor Líquido</p>
                        <p className="text-xl font-bold text-emerald-600">{formatCurrency(melhorOpcao.valorLiquido)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Taxa Mensal</p>
                        <p className="text-xl font-bold">{melhorOpcao.instituicao.taxaMensal}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Aprovação</p>
                        <p className="text-xl font-bold">{melhorOpcao.instituicao.prazoAprovacao}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-3">
                  {simulacoesInstituicoes.map((sim, idx) => (
                    <motion.div
                      key={sim.instituicao.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        instituicaoSelecionada === sim.instituicao.id 
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                          : 'hover:border-primary/50'
                      } ${sim.instituicao.destaque ? 'ring-1 ring-yellow-400/50' : ''}`}
                      onClick={() => setInstituicaoSelecionada(sim.instituicao.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{sim.instituicao.logo}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{sim.instituicao.nome}</p>
                              {sim.instituicao.destaque && (
                                <Badge variant="secondary" className="text-xs">
                                  <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                                  Destaque
                                </Badge>
                              )}
                              {idx === 0 && (
                                <Badge className="text-xs bg-emerald-500">Melhor</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>{sim.instituicao.taxaMensal}% a.m.</span>
                              <span>⚡ {sim.instituicao.prazoAprovacao}</span>
                              <span>⭐ {sim.instituicao.rating}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-emerald-600">{formatCurrency(sim.valorLiquido)}</p>
                          <p className="text-xs text-muted-foreground">
                            -{formatCurrency(sim.taxaTotal)} ({sim.taxaEfetiva.toFixed(2)}%)
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {instituicaoSelecionada && (
                  <Button className="w-full" size="lg">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Solicitar Antecipação
                  </Button>
                )}
              </TabsContent>

              <TabsContent value="personalizado" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Taxa Mensal: {taxaPersonalizada.toFixed(2)}%
                  </Label>
                  <Slider
                    value={[taxaPersonalizada]}
                    onValueChange={([v]) => setTaxaPersonalizada(v)}
                    min={0.5}
                    max={6}
                    step={0.05}
                  />
                  <p className="text-xs text-muted-foreground">
                    Taxa diária: {(taxaPersonalizada / 30).toFixed(4)}%
                  </p>
                </div>

                {simulacaoPersonalizada && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                  >
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Valor Bruto</p>
                      <p className="text-lg font-bold">{formatCurrency(simulacaoPersonalizada.valorBruto)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-destructive/10">
                      <p className="text-xs text-muted-foreground">Desconto</p>
                      <p className="text-lg font-bold text-destructive">-{formatCurrency(simulacaoPersonalizada.taxaTotal)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-500/10">
                      <p className="text-xs text-muted-foreground">Valor Líquido</p>
                      <p className="text-lg font-bold text-emerald-600">{formatCurrency(simulacaoPersonalizada.valorLiquido)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/10">
                      <p className="text-xs text-muted-foreground">Prazo Médio</p>
                      <p className="text-lg font-bold text-blue-600">{simulacaoPersonalizada.diasMedio} dias</p>
                    </div>
                  </motion.div>
                )}

                {simulacaoPersonalizada && simulacaoPersonalizada.economia > 0 && (
                  <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <span className="font-medium">Economia vs Empréstimo: {formatCurrency(simulacaoPersonalizada.economia)}</span>
                    </div>
                  </div>
                )}

                <Button className="w-full">Exportar Simulação</Button>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}