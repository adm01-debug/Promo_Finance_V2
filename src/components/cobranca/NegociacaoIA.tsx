import { useState } from 'react';
import { Bot, Send, Loader2, TrendingDown, MessageSquare, X, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/formatters';
import { motion, AnimatePresence } from 'framer-motion';

interface ContaVencida {
  id: string;
  cliente_nome: string;
  valor: number;
  data_vencimento: string;
  diasAtraso: number;
}

interface PropostaNegociacao {
  tipo: 'desconto' | 'parcelamento' | 'misto';
  descricao: string;
  valorOriginal: number;
  valorProposto: number;
  condicoes: string[];
  economia: number;
}

interface Mensagem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  propostas?: PropostaNegociacao[];
}

interface NegociacaoIAProps {
  contasVencidas?: ContaVencida[];
  clienteNome?: string;
  onPropostaAceita?: (proposta: PropostaNegociacao) => void;
}

export function NegociacaoIA({ contasVencidas = [], clienteNome, onPropostaAceita }: NegociacaoIAProps) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const valorTotal = contasVencidas.reduce((sum, c) => sum + c.valor, 0);
  const diasMedioAtraso = contasVencidas.length > 0 
    ? Math.round(contasVencidas.reduce((sum, c) => sum + c.diasAtraso, 0) / contasVencidas.length)
    : 0;

  const gerarPropostasIA = async (mensagemUsuario: string) => {
    setIsLoading(true);
    
    const contexto = `
Cliente: ${clienteNome || 'Cliente'}
Valor total em atraso: ${formatCurrency(valorTotal)}
Número de títulos: ${contasVencidas.length}
Dias médio de atraso: ${diasMedioAtraso} dias
Títulos: ${contasVencidas.map(c => `${c.cliente_nome} - ${formatCurrency(c.valor)} (${c.diasAtraso} dias)`).join(', ')}

Você é um especialista em negociação de dívidas. Analise a situação e sugira propostas de acordo considerando:
1. Descontos progressivos baseados no tempo de atraso
2. Parcelamentos que não comprometam o fluxo de caixa
3. Combinação de desconto + parcelamento
4. Análise do histórico do cliente

Responda de forma objetiva e proponha até 3 opções de negociação.
Pergunta do usuário: ${mensagemUsuario}
    `;

    try {
      const { data, error } = await supabase.functions.invoke('expert-agent', {
        body: {
          messages: [
            { role: 'system', content: 'Você é um especialista em negociação de dívidas corporativas. Seja objetivo e proponha soluções práticas.' },
            { role: 'user', content: contexto }
          ]
        }
      });

      if (error) throw error;

      const respostaIA = data?.message || data?.response || 'Não foi possível gerar propostas no momento.';
      
      // Gerar propostas baseadas na análise
      const propostas: PropostaNegociacao[] = [];
      
      // Proposta 1: Desconto à vista
      if (diasMedioAtraso > 30) {
        const descontoPercent = Math.min(15, Math.floor(diasMedioAtraso / 10));
        propostas.push({
          tipo: 'desconto',
          descricao: `Pagamento à vista com ${descontoPercent}% de desconto`,
          valorOriginal: valorTotal,
          valorProposto: valorTotal * (1 - descontoPercent / 100),
          condicoes: ['Pagamento em até 48h', 'Quitação total da dívida'],
          economia: valorTotal * (descontoPercent / 100)
        });
      }

      // Proposta 2: Parcelamento
      const numParcelas = Math.min(12, Math.ceil(valorTotal / 500));
      propostas.push({
        tipo: 'parcelamento',
        descricao: `Parcelamento em ${numParcelas}x sem juros`,
        valorOriginal: valorTotal,
        valorProposto: valorTotal,
        condicoes: [
          `${numParcelas} parcelas de ${formatCurrency(valorTotal / numParcelas)}`,
          'Entrada de 10%',
          'Vencimento todo dia 10'
        ],
        economia: 0
      });

      // Proposta 3: Misto
      propostas.push({
        tipo: 'misto',
        descricao: 'Entrada + parcelamento com desconto',
        valorOriginal: valorTotal,
        valorProposto: valorTotal * 0.92,
        condicoes: [
          'Entrada de 30%',
          `${Math.ceil(numParcelas / 2)}x restante`,
          '8% de desconto no total'
        ],
        economia: valorTotal * 0.08
      });

      return { resposta: respostaIA, propostas };
    } catch (error) {
      console.error('Erro na negociação IA:', error);
      toast.error('Erro ao gerar propostas');
      return { resposta: 'Desculpe, não foi possível processar sua solicitação.', propostas: [] };
    } finally {
      setIsLoading(false);
    }
  };

  const enviarMensagem = async () => {
    if (!input.trim() || isLoading) return;

    const msgUsuario: Mensagem = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input
    };

    setMensagens(prev => [...prev, msgUsuario]);
    setInput('');

    const { resposta, propostas } = await gerarPropostasIA(input);

    const msgAssistente: Mensagem = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: resposta,
      propostas
    };

    setMensagens(prev => [...prev, msgAssistente]);
  };

  const iniciarNegociacao = async () => {
    setIsOpen(true);
    if (mensagens.length === 0) {
      const msgInicial: Mensagem = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Olá! Sou o assistente de negociação. Vejo que ${clienteNome || 'o cliente'} possui ${contasVencidas.length} título(s) em atraso totalizando ${formatCurrency(valorTotal)}. Como posso ajudar a encontrar a melhor solução?`
      };
      setMensagens([msgInicial]);
    }
  };

  if (!isOpen) {
    return (
      <Button 
        onClick={iniciarNegociacao}
        className="gap-2"
        variant="outline"
      >
        <Bot className="h-4 w-4" />
        Negociação Assistida por IA
      </Button>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Negociação Inteligente</CardTitle>
              <CardDescription>
                Assistente IA para acordos de dívidas
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Resumo */}
        <div className="flex gap-3 mt-3">
          <Badge variant="secondary">
            {contasVencidas.length} título(s)
          </Badge>
          <Badge variant="destructive">
            {formatCurrency(valorTotal)} em atraso
          </Badge>
          <Badge variant="outline">
            ~{diasMedioAtraso} dias média
          </Badge>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="p-0">
        <ScrollArea className="h-80 p-4">
          <AnimatePresence mode="popLayout">
            {mensagens.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-4 ${msg.role === 'user' ? 'text-right' : ''}`}
              >
                <div className={`inline-block max-w-[85%] p-3 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>

                {/* Propostas */}
                {msg.propostas && msg.propostas.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {msg.propostas.map((proposta, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-3 rounded-lg border bg-card text-left"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={
                            proposta.tipo === 'desconto' ? 'default' :
                            proposta.tipo === 'parcelamento' ? 'secondary' : 'outline'
                          }>
                            {proposta.tipo === 'desconto' && <TrendingDown className="h-3 w-3 mr-1" />}
                            {proposta.descricao}
                          </Badge>
                          {proposta.economia > 0 && (
                            <span className="text-xs text-emerald-600 font-medium">
                              Economia: {formatCurrency(proposta.economia)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-muted-foreground line-through">
                            {formatCurrency(proposta.valorOriginal)}
                          </span>
                          <span className="text-lg font-bold text-emerald-600">
                            {formatCurrency(proposta.valorProposto)}
                          </span>
                        </div>

                        <ul className="text-xs text-muted-foreground space-y-1 mb-3">
                          {proposta.condicoes.map((c, i) => (
                            <li key={i}>• {c}</li>
                          ))}
                        </ul>

                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            onPropostaAceita?.(proposta);
                            toast.success('Proposta aceita! Gerando acordo...');
                          }}
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          Aceitar Proposta
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Analisando opções...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>

        <Separator />

        <div className="p-4 flex gap-2">
          <Input
            placeholder="Digite sua pergunta ou contraproposta..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && enviarMensagem()}
            disabled={isLoading}
          />
          <Button onClick={enviarMensagem} disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
