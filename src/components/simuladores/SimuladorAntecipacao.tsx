import { useState, useMemo } from 'react';
import { TrendingUp, Calculator, Calendar, DollarSign, Percent, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/formatters';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface RecebiveisDisponiveis {
  id: string;
  cliente_nome: string;
  valor: number;
  data_vencimento: string;
  diasParaVencimento: number;
}

interface SimulacaoResultado {
  valorBruto: number;
  taxaTotal: number;
  valorLiquido: number;
  economia: number;
  diasMedio: number;
}

export function SimuladorAntecipacao() {
  const [taxaMensal, setTaxaMensal] = useState(2.5);
  const [recebivelSelecionados, setRecebivelSelecionados] = useState<string[]>([]);
  const [dataAntecipacao, setDataAntecipacao] = useState(format(new Date(), 'yyyy-MM-dd'));

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
      prev.includes(id) 
        ? prev.filter(r => r !== id)
        : [...prev, id]
    );
  };

  const selecionarTodos = () => {
    if (recebivelSelecionados.length === recebiveis.length) {
      setRecebivelSelecionados([]);
    } else {
      setRecebivelSelecionados(recebiveis.map(r => r.id));
    }
  };

  const simulacao = useMemo((): SimulacaoResultado | null => {
    const selecionados = recebiveis.filter(r => recebivelSelecionados.includes(r.id));
    
    if (selecionados.length === 0) return null;

    const valorBruto = selecionados.reduce((sum, r) => sum + r.valor, 0);
    const hoje = new Date(dataAntecipacao);
    
    let taxaTotal = 0;
    let diasPonderados = 0;

    selecionados.forEach(r => {
      const diasAntecipados = differenceInDays(new Date(r.data_vencimento), hoje);
      const taxaProRata = (taxaMensal / 100) * (diasAntecipados / 30);
      taxaTotal += r.valor * taxaProRata;
      diasPonderados += diasAntecipados * r.valor;
    });

    const diasMedio = valorBruto > 0 ? diasPonderados / valorBruto : 0;
    const valorLiquido = valorBruto - taxaTotal;
    
    // Economia comparada a empréstimo bancário (taxa média 4% a.m.)
    const taxaEmprestimo = 4;
    const custoEmprestimo = valorBruto * (taxaEmprestimo / 100) * (diasMedio / 30);
    const economia = custoEmprestimo - taxaTotal;

    return {
      valorBruto,
      taxaTotal,
      valorLiquido,
      economia: Math.max(0, economia),
      diasMedio: Math.round(diasMedio)
    };
  }, [recebiveis, recebivelSelecionados, taxaMensal, dataAntecipacao]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Simulador de Antecipação de Recebíveis
        </CardTitle>
        <CardDescription>
          Simule a antecipação de suas vendas a prazo e veja o valor líquido
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
            <Label className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Taxa Mensal: {taxaMensal.toFixed(1)}%
            </Label>
            <Slider
              value={[taxaMensal]}
              onValueChange={([v]) => setTaxaMensal(v)}
              min={1}
              max={5}
              step={0.1}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground">
              Taxa de {(taxaMensal / 30).toFixed(3)}% ao dia
            </p>
          </div>
        </div>

        <Separator />

        {/* Lista de Recebíveis */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Recebíveis Disponíveis</h4>
            <Button variant="outline" size="sm" onClick={selecionarTodos}>
              {recebivelSelecionados.length === recebiveis.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </Button>
          </div>

          {recebiveis.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum recebível disponível para antecipação</p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {recebiveis.map(rec => {
                const selecionado = recebivelSelecionados.includes(rec.id);
                return (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selecionado 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => toggleRecebivel(rec.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{rec.cliente_nome}</p>
                        <p className="text-xs text-muted-foreground">
                          Vence em {format(new Date(rec.data_vencimento), "dd 'de' MMM", { locale: ptBR })}
                          {' '}({rec.diasParaVencimento} dias)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(rec.valor)}</p>
                        <Badge variant={selecionado ? "default" : "outline"} className="text-xs">
                          {selecionado ? 'Selecionado' : 'Selecionar'}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <Separator />

        {/* Resultado da Simulação */}
        <AnimatePresence mode="wait">
          {simulacao && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <h4 className="font-medium flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Resultado da Simulação
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Valor Bruto</p>
                  <p className="text-lg font-bold">{formatCurrency(simulacao.valorBruto)}</p>
                </div>
                <div className="p-3 rounded-lg bg-destructive/10">
                  <p className="text-xs text-muted-foreground">Desconto (Taxa)</p>
                  <p className="text-lg font-bold text-destructive">
                    - {formatCurrency(simulacao.taxaTotal)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="text-left">
                        <p className="text-xs text-muted-foreground">Valor Líquido</p>
                        <p className="text-lg font-bold text-emerald-600">
                          {formatCurrency(simulacao.valorLiquido)}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Valor que você receberá antecipadamente</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <p className="text-xs text-muted-foreground">Prazo Médio</p>
                  <p className="text-lg font-bold text-blue-600">
                    {simulacao.diasMedio} dias
                  </p>
                </div>
              </div>

              {simulacao.economia > 0 && (
                <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Info className="h-4 w-4 text-emerald-600" />
                    <span className="font-medium text-emerald-700">Economia Estimada</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Comparado a um empréstimo bancário (4% a.m.), você economiza aproximadamente{' '}
                    <span className="font-semibold text-emerald-600">{formatCurrency(simulacao.economia)}</span>
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button className="flex-1">
                  Solicitar Antecipação
                </Button>
                <Button variant="outline">
                  Exportar Simulação
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!simulacao && recebiveis.length > 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Calculator className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Selecione os recebíveis para simular a antecipação</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
