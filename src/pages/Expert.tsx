import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  Send, 
  Loader2, 
  Sparkles, 
  MessageSquare,
  Lightbulb,
  TrendingUp,
  FileQuestion,
  User,
  Copy,
  Check,
  Database,
  Zap,
  FileText,
  Bell,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  History,
  Plus,
  Trash2,
  X,
  Search,
  Calendar,
  Filter,
  FileUp,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/layout/MainLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useExpertContext } from '@/hooks/useExpertContext';
import { useExpertActions, ExpertAction } from '@/hooks/useExpertActions';
import { 
  useExpertConversations, 
  useExpertMessages, 
  useCreateConversation,
  useUpdateConversation,
  useDeleteConversation,
  useSaveMessage,
  useUpdateMessageActions,
  ExpertMessage
} from '@/hooks/useExpertConversations';
import { DocumentAnalyzer } from '@/components/expert/DocumentAnalyzer';
import { ProactiveSuggestions } from '@/components/expert/ProactiveSuggestions';
import { formatDistanceToNow, isToday, isThisWeek, isThisMonth, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LocalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: ExpertAction[];
  actionsExecuted?: boolean;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/expert-agent`;

const suggestedQuestions = [
  {
    icon: TrendingUp,
    label: 'Previsão de Caixa',
    question: 'Qual a previsão de fluxo de caixa para os próximos 30 dias considerando os títulos em aberto?'
  },
  {
    icon: Lightbulb,
    label: 'Melhorias',
    question: 'Quais melhorias você sugere para reduzir a inadimplência dos clientes?'
  },
  {
    icon: FileQuestion,
    label: 'Processo de Aprovação',
    question: 'Como funciona o processo de aprovação de pagamentos acima de R$ 5.000?'
  },
  {
    icon: MessageSquare,
    label: 'Conciliação Bancária',
    question: 'Quais são as melhores práticas para realizar a conciliação bancária diária?'
  },
];

const quickActions = [
  {
    icon: FileText,
    label: 'Relatório de Caixa',
    prompt: 'Gere um relatório de fluxo de caixa para os próximos dias'
  },
  {
    icon: Bell,
    label: 'Criar Alerta',
    prompt: 'Crie um alerta de alta prioridade para revisar as contas a pagar da semana'
  },
  {
    icon: CheckCircle,
    label: 'Ver Aprovações',
    prompt: 'Liste todas as aprovações de pagamento pendentes'
  },
  {
    icon: AlertTriangle,
    label: 'Inadimplência',
    prompt: 'Gere um relatório de inadimplência com os títulos vencidos'
  },
];

export default function Expert() {
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [executingActions, setExecutingActions] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { resumoFinanceiro, isLoading: loadingContext } = useExpertContext();
  const { executeAction, parseActionsFromMessage, getCleanContent } = useExpertActions();
  
  // Database hooks
  const { data: conversations, isLoading: loadingConversations } = useExpertConversations();
  const { data: savedMessages } = useExpertMessages(currentConversationId);
  const createConversation = useCreateConversation();
  const updateConversation = useUpdateConversation();
  const deleteConversation = useDeleteConversation();
  const saveMessage = useSaveMessage();
  const updateMessageActions = useUpdateMessageActions();

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    
    return conversations.filter(conv => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        conv.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (conv.resumo && conv.resumo.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Date filter
      const convDate = new Date(conv.created_at);
      let matchesDate = true;
      
      switch (dateFilter) {
        case 'today':
          matchesDate = isToday(convDate);
          break;
        case 'week':
          matchesDate = isThisWeek(convDate, { locale: ptBR });
          break;
        case 'month':
          matchesDate = isThisMonth(convDate);
          break;
        case 'older':
          matchesDate = convDate < subDays(new Date(), 30);
          break;
        default:
          matchesDate = true;
      }
      
      return matchesSearch && matchesDate;
    });
  }, [conversations, searchQuery, dateFilter]);

  // Load messages when conversation changes
  useEffect(() => {
    if (savedMessages) {
      setMessages(savedMessages.map((m: ExpertMessage) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.created_at),
        actions: m.actions,
        actionsExecuted: m.actions_executed,
      })));
    }
  }, [savedMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Copiado para a área de transferência');
  };

  const handleExecuteActions = async (messageId: string, actions: ExpertAction[]) => {
    setExecutingActions(messageId);
    
    for (const action of actions) {
      await executeAction(action);
    }
    
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, actionsExecuted: true } : m
    ));
    
    // Update in database
    if (currentConversationId) {
      updateMessageActions.mutate({ messageId, conversationId: currentConversationId });
    }
    
    setExecutingActions(null);
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setShowHistory(false);
  };

  const loadConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    setShowHistory(false);
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation.mutate(id);
    if (currentConversationId === id) {
      startNewConversation();
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    // Create or get conversation
    let conversationId = currentConversationId;
    if (!conversationId) {
      try {
        const newConversation = await createConversation.mutateAsync(messageText.slice(0, 50));
        conversationId = newConversation.id;
        setCurrentConversationId(conversationId);
      } catch (error) {
        console.error('Error creating conversation:', error);
        toast.error('Erro ao criar conversa');
        return;
      }
    }

    const userMessage: LocalMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Save user message to database
    try {
      const savedUserMsg = await saveMessage.mutateAsync({
        conversation_id: conversationId,
        role: 'user',
        content: messageText.trim(),
      });
      userMessage.id = savedUserMsg.id;
    } catch (error) {
      console.error('Error saving user message:', error);
    }

    let assistantContent = '';
    const assistantId = crypto.randomUUID();

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          context: resumoFinanceiro,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar solicitação');
      }

      if (!response.body) throw new Error('Resposta vazia');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      // Add initial empty assistant message
      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => prev.map(m => 
                m.id === assistantId 
                  ? { ...m, content: assistantContent }
                  : m
              ));
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => prev.map(m => 
                m.id === assistantId 
                  ? { ...m, content: assistantContent }
                  : m
              ));
            }
          } catch { /* ignore */ }
        }
      }

      // Parse actions from final content
      const actions = parseActionsFromMessage(assistantContent);
      const cleanContent = getCleanContent(assistantContent);
      
      if (actions.length > 0) {
        setMessages(prev => prev.map(m => 
          m.id === assistantId 
            ? { ...m, actions, content: cleanContent }
            : m
        ));
      }

      // Save assistant message to database
      try {
        const savedAssistantMsg = await saveMessage.mutateAsync({
          conversation_id: conversationId,
          role: 'assistant',
          content: cleanContent || assistantContent,
          actions: actions.length > 0 ? actions : undefined,
        });
        
        // Update local message ID
        setMessages(prev => prev.map(m => 
          m.id === assistantId ? { ...m, id: savedAssistantMsg.id } : m
        ));

        // Update conversation title with first user message summary
        if (messages.length === 0) {
          updateConversation.mutate({
            id: conversationId,
            titulo: messageText.slice(0, 50) + (messageText.length > 50 ? '...' : ''),
            resumo: cleanContent?.slice(0, 100),
          });
        }
      } catch (error) {
        console.error('Error saving assistant message:', error);
      }

    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar mensagem');
      setMessages(prev => prev.filter(m => m.id !== assistantId));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const getActionLabel = (action: ExpertAction): string => {
    switch (action.type) {
      case 'criar_alerta':
        return `Criar alerta: ${action.titulo}`;
      case 'gerar_relatorio':
        return `Gerar relatório: ${action.relatorio}`;
      case 'listar_aprovacoes':
        return 'Listar aprovações pendentes';
      case 'aprovar_pagamento':
        return `Aprovar pagamento ${action.id}`;
      case 'navegar':
        return `Ir para ${action.pagina}`;
      default:
        return 'Executar ação';
    }
  };

  const getActionIcon = (action: ExpertAction) => {
    switch (action.type) {
      case 'criar_alerta':
        return Bell;
      case 'gerar_relatorio':
        return FileText;
      case 'listar_aprovacoes':
        return CheckCircle;
      case 'aprovar_pagamento':
        return CheckCircle;
      case 'navegar':
        return ExternalLink;
      default:
        return Zap;
    }
  };

  return (
    <MainLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                EXPERT
                <Badge variant="secondary" className="text-xs">IA</Badge>
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                Seu assistente inteligente para decisões financeiras
                {loadingContext ? (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Carregando dados...
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-success">
                    <Database className="h-3 w-3" />
                    Dados atualizados
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowHistory(!showHistory)}
              className={cn(showHistory && "bg-muted")}
            >
              <History className="h-4 w-4 mr-2" />
              Histórico
              {conversations && conversations.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {conversations.length}
                </Badge>
              )}
            </Button>
            {(messages.length > 0 || currentConversationId) && (
              <Button variant="outline" size="sm" onClick={startNewConversation}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Conversa
              </Button>
            )}
          </div>
        </div>

        {/* History Panel */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Conversas Anteriores
                  </h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Search and Filters */}
                <div className="flex gap-2 mb-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar conversas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-[140px] h-9">
                      <Calendar className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="week">Esta semana</SelectItem>
                      <SelectItem value="month">Este mês</SelectItem>
                      <SelectItem value="older">Mais antigas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {loadingConversations ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredConversations.length > 0 ? (
                  <ScrollArea className="max-h-48">
                    <div className="space-y-2">
                      {filteredConversations.map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => loadConversation(conv.id)}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 group",
                            currentConversationId === conv.id && "bg-muted border-primary"
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{conv.titulo}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true, locale: ptBR })}
                              </p>
                              {conv.resumo && (
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  • {conv.resumo}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDeleteConversation(conv.id, e)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : conversations && conversations.length > 0 ? (
                  <div className="text-center py-4">
                    <Filter className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma conversa encontrada com os filtros aplicados
                    </p>
                    <Button 
                      variant="link" 
                      size="sm" 
                      onClick={() => { setSearchQuery(''); setDateFilter('all'); }}
                    >
                      Limpar filtros
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma conversa salva ainda
                  </p>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Proactive Suggestions Panel */}
        {messages.length === 0 && showSuggestions && (
          <div className="mb-4">
            <ProactiveSuggestions 
              onSuggestionClick={(suggestion) => sendMessage(suggestion)} 
            />
          </div>
        )}

        {/* Chat Container */}
        <Card className="flex-1 flex flex-col overflow-hidden border-2">
          {messages.length === 0 ? (
            /* Welcome Screen */
            <ScrollArea className="flex-1">
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mb-6"
                >
                  <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 mx-auto">
                    <Sparkles className="h-12 w-12 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Olá! Sou o EXPERT</h2>
                  <p className="text-muted-foreground max-w-md">
                    Estou aqui para ajudar você a tomar melhores decisões financeiras, 
                    prever cenários e esclarecer dúvidas sobre processos.
                  </p>
                </motion.div>

                {/* Quick Actions */}
                <div className="w-full max-w-2xl mb-6">
                  <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2 justify-center">
                    <Zap className="h-4 w-4" />
                    Ações Rápidas
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {quickActions.map((action, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => sendMessage(action.prompt)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full border bg-card hover:bg-primary hover:text-primary-foreground text-sm transition-colors"
                      >
                        <action.icon className="h-4 w-4" />
                        {action.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                  {suggestedQuestions.map((item, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      onClick={() => sendMessage(item.question)}
                      className="flex items-start gap-3 p-4 rounded-xl border bg-card hover:bg-muted/50 text-left transition-colors group"
                    >
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.question}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </ScrollArea>
          ) : (
            /* Messages */
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4 max-w-3xl mx-auto">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={cn(
                        "flex gap-3",
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                          <Bot className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-3 relative group",
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      )}>
                        <div className="whitespace-pre-wrap text-sm">
                          {message.content || (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Pensando...</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        {message.role === 'assistant' && message.actions && message.actions.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              {message.actionsExecuted ? 'Ações executadas' : 'Ações disponíveis'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {message.actions.map((action, idx) => {
                                const ActionIcon = getActionIcon(action);
                                return (
                                  <Button
                                    key={idx}
                                    size="sm"
                                    variant={message.actionsExecuted ? "ghost" : "secondary"}
                                    disabled={message.actionsExecuted || executingActions === message.id}
                                    onClick={() => handleExecuteActions(message.id, [action])}
                                    className="text-xs"
                                  >
                                    {executingActions === message.id ? (
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    ) : message.actionsExecuted ? (
                                      <Check className="h-3 w-3 mr-1 text-success" />
                                    ) : (
                                      <ActionIcon className="h-3 w-3 mr-1" />
                                    )}
                                    {getActionLabel(action)}
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {message.role === 'assistant' && message.content && (
                          <button
                            onClick={() => copyToClipboard(message.content, message.id)}
                            className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-background border shadow-sm hover:bg-muted"
                          >
                            {copiedId === message.id ? (
                              <Check className="h-3 w-3 text-success" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        )}
                      </div>
                      {message.role === 'user' && (
                        <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-secondary-foreground" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          )}

          {/* Input Area */}
          <div className="p-4 border-t bg-card/50">
            <div className="max-w-3xl mx-auto">
              {/* Document Upload Toggle */}
              <Collapsible open={showDocumentUpload} onOpenChange={setShowDocumentUpload}>
                <div className="flex items-center gap-2 mb-3">
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <FileUp className="h-4 w-4" />
                      Analisar Documento
                      {showDocumentUpload ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <span className="text-xs text-muted-foreground">
                    Upload de PDF, planilhas ou imagens para análise
                  </span>
                </div>
                <CollapsibleContent className="mb-3">
                  <DocumentAnalyzer 
                    onAnalysisComplete={(analysis) => {
                      sendMessage(`Análise do documento:\n\n${analysis}`);
                      setShowDocumentUpload(false);
                    }} 
                  />
                </CollapsibleContent>
              </Collapsible>

              <form onSubmit={handleSubmit}>
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite sua pergunta para o EXPERT..."
                    className="min-h-[60px] max-h-[200px] pr-14 resize-none"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 bottom-2 h-10 w-10 rounded-xl"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Pressione Enter para enviar ou Shift+Enter para nova linha
                </p>
              </form>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
