import { useState, useMemo, useCallback } from 'react';
import { TrendingUp, Calculator, Calendar, DollarSign, Percent, Building2, ArrowRight, CheckCircle2, Star, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/formatters';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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

  const calcularSimulacao = useCallback((taxa: number): Omit<SimulacaoResultado, 'instituicao'> | null => {
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
  }, [recebiveis, recebivelSelecionados, dataAntecipacao]);

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
  }, [recebiveis, recebivelSelecionados, calcularSimulacao]);

  const simulacaoPersonalizada = useMemo(() => {
    return calcularSimulacao(taxaPersonalizada);
  }, [taxaPersonalizada, calcularSimulacao]);

  const melhorOpcao = simulacoesInstituicoes[0];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] rounded-[2.5rem] overflow-hidden ring-1 ring-white/10 relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        
        <CardHeader className="p-8 pb-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center text-primary-foreground">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black tracking-tight">Quantum Anticipation Matrix</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-60">Motor de Liquidez Imediata e Simulação Neural</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 pt-4 space-y-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                <Calendar className="h-4 w-4 text-primary" />
                Horizonte de Antecipação
              </Label>
              <div className="relative group">
                <Input
                  type="date"
                  value={dataAntecipacao}
                  onChange={(e) => setDataAntecipacao(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="h-14 bg-black/20 border-white/10 rounded-2xl px-6 font-bold text-lg focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                <DollarSign className="h-4 w-4 text-primary" />
                Seleção de Ativos Alpha
              </Label>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={selecionarTodos} 
                className="w-full h-14 rounded-2xl border-white/10 bg-card/5 font-black uppercase tracking-widest text-xs hover:bg-card/10 transition-all gap-2"
              >
                {recebivelSelecionados.length === recebiveis.length ? (
                  <>Purge Selection ({recebiveis.length})</>
                ) : (
                  <>Engage All Assets ({recebiveis.length})</>
                )}
              </Button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/5 bg-black/20 p-2 shadow-inner">
            {recebiveis.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-card/5 flex items-center justify-center border border-white/10">
                  <DollarSign className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-black tracking-tight opacity-40 italic">Zero Liquid Assets Available</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30">Nenhum título pendente detectado no repositório</p>
                </div>
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto space-y-2 p-2 custom-scrollbar">
                {recebiveis.map(rec => {
                  const selecionado = recebivelSelecionados.includes(rec.id);
                  return (
                    <motion.div
                      key={rec.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={cn(
                        "p-5 rounded-2xl cursor-pointer transition-all border group",
                        selecionado 
                          ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(var(--primary),0.1)]" 
                          : "bg-card/5 border-white/5 hover:bg-card/10 hover:border-white/10"
                      )}
                      onClick={() => toggleRecebivel(rec.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                            selecionado ? "bg-primary text-primary-foreground" : "bg-card/10 text-muted-foreground/60"
                          )}>
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-black text-sm tracking-tight">{rec.cliente_nome}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(rec.data_vencimento), "dd MMM yyyy", { locale: ptBR })} 
                              <span className="w-1 h-1 rounded-full bg-card/20" />
                              Horizonte: {rec.diasParaVencimento}d
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "font-black text-lg tracking-tighter",
                            selecionado ? "text-primary" : "text-foreground"
                          )}>
                            {formatCurrency(rec.valor)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {recebivelSelecionados.length > 0 && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <Tabs value={modoComparacao} onValueChange={(v) => setModoComparacao(v as 'instituicoes' | 'personalizado')} className="w-full">
                  <TabsList className="inline-flex h-14 items-center justify-center rounded-2xl bg-card/5 p-1 text-muted-foreground w-full border border-white/10 backdrop-blur-xl mb-8">
                    <TabsTrigger value="instituicoes" className="flex-1 h-12 rounded-xl data-[state=active]:bg-card data-[state=active]:text-primary font-black text-xs gap-2 uppercase tracking-widest">
                      <Building2 className="h-4 w-4" />
                      Institutional Matrix
                    </TabsTrigger>
                    <TabsTrigger value="personalizado" className="flex-1 h-12 rounded-xl data-[state=active]:bg-card data-[state=active]:text-primary font-black text-xs gap-2 uppercase tracking-widest">
                      <Calculator className="h-4 w-4" />
                      Neural Override
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="instituicoes" className="mt-0 outline-none space-y-6">
                    {melhorOpcao && (
                      <motion.div
                        layoutId="best-option"
                        className="p-8 rounded-[2rem] bg-gradient-to-br from-success/20 via-primary/10 to-transparent border border-success/30 shadow-[0_20px_40px_-15px_rgba(34,197,94,0.2)] relative overflow-hidden group"
                      >
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Sparkles className="h-24 w-24 text-success" />
                        </div>
                        <div className="relative z-10 space-y-6">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-success/20 flex items-center justify-center">
                              <CheckCircle2 className="h-5 w-5 text-success" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-success">Optimal Liquidity Vector Detected</span>
                            <Badge variant="outline" className="bg-success/10 border-success/20 text-success text-[10px] font-black uppercase px-3 py-1">{melhorOpcao.instituicao.nome}</Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Immediate Net Value</p>
                              <p className="text-4xl font-black tracking-tighter text-success shadow-success/20">{formatCurrency(melhorOpcao.valorLiquido)}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Baseline Fee (Monthly)</p>
                              <p className="text-4xl font-black tracking-tighter">{melhorOpcao.instituicao.taxaMensal}%</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Execution Window</p>
                              <p className="text-4xl font-black tracking-tighter text-primary">⚡ {melhorOpcao.instituicao.prazoAprovacao}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {simulacoesInstituicoes.map((sim, idx) => (
                        <motion.div
                          key={sim.instituicao.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={cn(
                            "p-6 rounded-2xl border transition-all cursor-pointer relative group",
                            instituicaoSelecionada === sim.instituicao.id 
                              ? "bg-card/10 border-primary ring-1 ring-primary/20 shadow-lg" 
                              : "bg-card/5 border-white/5 hover:bg-card/10 hover:border-white/10"
                          )}
                          onClick={() => setInstituicaoSelecionada(sim.instituicao.id)}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <span className="text-3xl filter drop-shadow-lg group-hover:scale-110 transition-transform">{sim.instituicao.logo}</span>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-black text-sm tracking-tight">{sim.instituicao.nome}</p>
                                  {sim.instituicao.destaque && (
                                    <Star className="h-3 w-3 fill-warning text-warning animate-pulse" />
                                  )}
                                  {idx === 0 && (
                                    <Badge className="bg-success text-[8px] font-black h-4 px-1 rounded">MAX</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                                  <span>{sim.instituicao.taxaMensal}% a.m.</span>
                                  <span className="w-1 h-1 rounded-full bg-card/20" />
                                  <span>{sim.instituicao.prazoAprovacao}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-lg tracking-tighter text-success">{formatCurrency(sim.valorLiquido)}</p>
                              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
                                -{formatCurrency(sim.taxaTotal)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {instituicaoSelecionada && (
                      <Button className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg gap-3 shadow-xl shadow-primary/20 transition-all hover:translate-y-[-2px]">
                        Execute Capital Infusion <ArrowRight className="h-5 w-5" />
                      </Button>
                    )}
                  </TabsContent>

                  <TabsContent value="personalizado" className="mt-0 outline-none space-y-8">
                    <Card className="border-white/5 bg-black/20 p-8 rounded-[2rem] shadow-inner">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                            <Percent className="h-4 w-4 text-primary" />
                            Neural Override Fee
                          </Label>
                          <span className="text-2xl font-black tracking-tighter text-primary">{taxaPersonalizada.toFixed(2)}%</span>
                        </div>
                        <Slider
                          value={[taxaPersonalizada]}
                          onValueChange={([v]) => setTaxaPersonalizada(v)}
                          min={0.5}
                          max={6}
                          step={0.05}
                          className="py-4"
                        />
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 italic">
                          <span>Minimum (0.5%)</span>
                          <span>Daily Rate: {(taxaPersonalizada / 30).toFixed(4)}%</span>
                          <span>Maximum (6.0%)</span>
                        </div>
                      </div>
                    </Card>

                    {simulacaoPersonalizada && (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { label: 'Gross Exposure', value: formatCurrency(simulacaoPersonalizada.valorBruto), color: 'text-foreground' },
                          { label: 'Neural Deduction', value: `-${formatCurrency(simulacaoPersonalizada.taxaTotal)}`, color: 'text-destructive' },
                          { label: 'Projected Liquidity', value: formatCurrency(simulacaoPersonalizada.valorLiquido), color: 'text-success' },
                          { label: 'Average Horizon', value: `${simulacaoPersonalizada.diasMedio} Days`, color: 'text-primary' },
                        ].map((stat, i) => (
                          <div key={i} className="p-6 rounded-2xl bg-card/5 border border-white/5 space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">{stat.label}</p>
                            <p className={cn("text-xl font-black tracking-tighter", stat.color)}>{stat.value}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {simulacaoPersonalizada && simulacaoPersonalizada.economia > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 rounded-2xl bg-gradient-to-r from-success/10 to-primary/10 border border-success/20 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-success/20 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-success" />
                          </div>
                          <div>
                            <p className="text-sm font-black tracking-tight">Strategy Efficiency Gain</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">vs. Standard Debt Instruments</p>
                          </div>
                        </div>
                        <span className="text-xl font-black tracking-tighter text-success">+{formatCurrency(simulacaoPersonalizada.economia)}</span>
                      </motion.div>
                    )}

                    <Button variant="outline" className="w-full h-14 rounded-2xl border-white/10 bg-card/5 font-black uppercase tracking-widest text-xs hover:bg-card/10">
                      Export Neural Simulation Report
                    </Button>
                  </TabsContent>
                </Tabs>
              </motion.div>
            </AnimatePresence>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
