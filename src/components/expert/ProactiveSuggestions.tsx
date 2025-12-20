import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign, 
  Users, 
  Calendar,
  ChevronRight,
  X,
  Sparkles
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/formatters';

interface ProactiveSuggestion {
  id: string;
  type: 'risco' | 'oportunidade' | 'alerta' | 'otimizacao';
  title: string;
  description: string;
  impact?: string;
  action?: string;
  priority: 'baixa' | 'media' | 'alta' | 'critica';
}

interface ProactiveSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
}

export function ProactiveSuggestions({ onSuggestionClick }: ProactiveSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<ProactiveSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    analyzePatternsAndGenerateSuggestions();
  }, []);

  const analyzePatternsAndGenerateSuggestions = async () => {
    setIsLoading(true);
    const newSuggestions: ProactiveSuggestion[] = [];

    try {
      const hoje = new Date();
      const em7Dias = new Date();
      em7Dias.setDate(em7Dias.getDate() + 7);
      const em30Dias = new Date();
      em30Dias.setDate(em30Dias.getDate() + 30);

      // 1. Verificar saldo projetado
      const { data: saldos } = await supabase
        .from('contas_bancarias')
        .select('saldo_atual')
        .eq('ativo', true);

      const { data: contasPagar } = await supabase
        .from('contas_pagar')
        .select('valor, data_vencimento')
        .eq('status', 'pendente')
        .lte('data_vencimento', em30Dias.toISOString().split('T')[0]);

      const { data: contasReceber } = await supabase
        .from('contas_receber')
        .select('valor, data_vencimento, status')
        .in('status', ['pendente', 'vencido'])
        .lte('data_vencimento', em30Dias.toISOString().split('T')[0]);

      const saldoAtual = saldos?.reduce((sum, c) => sum + Number(c.saldo_atual), 0) || 0;
      const totalPagar = contasPagar?.reduce((sum, c) => sum + Number(c.valor), 0) || 0;
      const totalReceber = contasReceber?.filter(c => c.status === 'pendente')
        .reduce((sum, c) => sum + Number(c.valor), 0) || 0;
      const saldoProjetado = saldoAtual + totalReceber - totalPagar;

      if (saldoProjetado < 0) {
        newSuggestions.push({
          id: 'risco-saldo-negativo',
          type: 'risco',
          title: 'Risco de Saldo Negativo',
          description: `Saldo projetado para os próximos 30 dias é ${formatCurrency(saldoProjetado)}. Ação urgente necessária.`,
          impact: formatCurrency(Math.abs(saldoProjetado)),
          action: 'Analise o fluxo de caixa e identifique possíveis antecipações de recebimento ou renegociações de pagamento.',
          priority: 'critica',
        });
      } else if (saldoProjetado < saldoAtual * 0.3) {
        newSuggestions.push({
          id: 'alerta-saldo-baixo',
          type: 'alerta',
          title: 'Saldo Projetado Baixo',
          description: `O saldo projetado é ${formatCurrency(saldoProjetado)}, apenas ${((saldoProjetado / saldoAtual) * 100).toFixed(0)}% do saldo atual.`,
          priority: 'alta',
        });
      }

      // 2. Verificar inadimplência
      const totalVencido = contasReceber?.filter(c => c.status === 'vencido')
        .reduce((sum, c) => sum + Number(c.valor), 0) || 0;
      const taxaInadimplencia = totalReceber > 0 
        ? (totalVencido / (totalReceber + totalVencido)) * 100 
        : 0;

      if (taxaInadimplencia > 10) {
        newSuggestions.push({
          id: 'alerta-inadimplencia',
          type: 'alerta',
          title: 'Alta Taxa de Inadimplência',
          description: `Taxa de inadimplência está em ${taxaInadimplencia.toFixed(1)}%. Total vencido: ${formatCurrency(totalVencido)}.`,
          impact: formatCurrency(totalVencido),
          action: 'Intensifique as ações de cobrança e revise a política de crédito.',
          priority: 'alta',
        });
      }

      // 3. Verificar concentração de vencimentos
      const vencimentosProximos = contasPagar?.filter(c => {
        const dataVenc = new Date(c.data_vencimento);
        return dataVenc >= hoje && dataVenc <= em7Dias;
      }) || [];

      const totalVencimentosProximos = vencimentosProximos.reduce((sum, c) => sum + Number(c.valor), 0);

      if (vencimentosProximos.length >= 5 && totalVencimentosProximos > saldoAtual * 0.5) {
        newSuggestions.push({
          id: 'alerta-concentracao',
          type: 'alerta',
          title: 'Concentração de Vencimentos',
          description: `${vencimentosProximos.length} títulos vencem nos próximos 7 dias, totalizando ${formatCurrency(totalVencimentosProximos)}.`,
          action: 'Considere renegociar prazos para distribuir melhor os pagamentos.',
          priority: 'media',
        });
      }

      // 4. Verificar clientes de risco
      const { data: clientesRisco } = await supabase
        .from('clientes')
        .select('id, razao_social, score')
        .eq('ativo', true)
        .lt('score', 60);

      if (clientesRisco && clientesRisco.length > 0) {
        const clienteIds = clientesRisco.map(c => c.id);
        const { data: contasClientesRisco } = await supabase
          .from('contas_receber')
          .select('valor, cliente_id')
          .in('cliente_id', clienteIds)
          .in('status', ['pendente', 'vencido']);

        const totalEmRisco = contasClientesRisco?.reduce((sum, c) => sum + Number(c.valor), 0) || 0;

        if (totalEmRisco > 0) {
          newSuggestions.push({
            id: 'alerta-clientes-risco',
            type: 'risco',
            title: 'Clientes de Alto Risco',
            description: `${clientesRisco.length} clientes com score baixo têm ${formatCurrency(totalEmRisco)} em aberto.`,
            impact: formatCurrency(totalEmRisco),
            action: 'Revise os limites de crédito e intensifique o acompanhamento desses clientes.',
            priority: 'alta',
          });
        }
      }

      // 5. Oportunidade de otimização
      if (saldoAtual > totalPagar * 2 && totalPagar > 0) {
        newSuggestions.push({
          id: 'oportunidade-antecipacao',
          type: 'oportunidade',
          title: 'Oportunidade de Desconto',
          description: 'Saldo disponível permite antecipar pagamentos. Verifique fornecedores que oferecem desconto para pagamento antecipado.',
          action: 'Consulte os fornecedores sobre descontos disponíveis.',
          priority: 'baixa',
        });
      }

      // 6. Verificar aprovações pendentes
      const { data: aprovacoesPendentes, count } = await supabase
        .from('solicitacoes_aprovacao')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente');

      if (count && count > 3) {
        newSuggestions.push({
          id: 'otimizacao-aprovacoes',
          type: 'otimizacao',
          title: 'Aprovações Pendentes',
          description: `Existem ${count} pagamentos aguardando aprovação.`,
          action: 'Revise as aprovações pendentes para liberar os pagamentos.',
          priority: 'media',
        });
      }

    } catch (error) {
      console.error('Error generating suggestions:', error);
    }

    setSuggestions(newSuggestions);
    setIsLoading(false);
  };

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  const handleAction = (suggestion: ProactiveSuggestion) => {
    const prompt = `${suggestion.title}: ${suggestion.description}${suggestion.action ? ` Sugestão: ${suggestion.action}` : ''} O que você recomenda fazer?`;
    onSuggestionClick(prompt);
  };

  const getIcon = (type: ProactiveSuggestion['type']) => {
    switch (type) {
      case 'risco':
        return TrendingDown;
      case 'oportunidade':
        return DollarSign;
      case 'alerta':
        return AlertTriangle;
      case 'otimizacao':
        return Lightbulb;
    }
  };

  const getColor = (type: ProactiveSuggestion['type']) => {
    switch (type) {
      case 'risco':
        return 'text-destructive';
      case 'oportunidade':
        return 'text-success';
      case 'alerta':
        return 'text-warning';
      case 'otimizacao':
        return 'text-primary';
    }
  };

  const getPriorityBadge = (priority: ProactiveSuggestion['priority']) => {
    const variants: Record<string, string> = {
      baixa: 'bg-muted text-muted-foreground',
      media: 'bg-warning/20 text-warning',
      alta: 'bg-orange-500/20 text-orange-600',
      critica: 'bg-destructive/20 text-destructive',
    };
    return variants[priority] || variants.media;
  };

  const visibleSuggestions = suggestions.filter(s => !dismissedIds.has(s.id));

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="h-4 w-4 animate-pulse" />
          <span className="text-sm">Analisando padrões...</span>
        </div>
      </Card>
    );
  }

  if (visibleSuggestions.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Sugestões Proativas</h3>
        <Badge variant="secondary" className="text-xs">IA</Badge>
      </div>
      
      <ScrollArea className="max-h-48">
        <div className="space-y-2">
          <AnimatePresence>
            {visibleSuggestions.map((suggestion) => {
              const Icon = getIcon(suggestion.type);
              return (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="group relative bg-background rounded-lg p-3 border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", getColor(suggestion.type))} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{suggestion.title}</span>
                        <Badge className={cn("text-xs", getPriorityBadge(suggestion.priority))}>
                          {suggestion.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {suggestion.description}
                      </p>
                      {suggestion.impact && (
                        <p className="text-xs font-medium text-primary mt-1">
                          Impacto: {suggestion.impact}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => handleAction(suggestion)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-muted-foreground"
                        onClick={() => handleDismiss(suggestion.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </Card>
  );
}
