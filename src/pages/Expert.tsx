import { useState, useRef, useEffect, useMemo } from 'react';
import { Bot, Send, Loader2, History, Plus, Database, FileUp, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/layout/MainLayout';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useExpertContext } from '@/hooks/useExpertContext';
import { useExpertActions, ExpertAction } from '@/hooks/useExpertActions';
import { useExpertConversations, useExpertMessages, useCreateConversation, useUpdateConversation, useDeleteConversation, useSaveMessage, useUpdateMessageActions, ExpertMessage } from '@/hooks/useExpertConversations';
import { DocumentAnalyzer } from '@/components/expert/DocumentAnalyzer';
import { ProactiveSuggestions } from '@/components/expert/ProactiveSuggestions';
import { ExpertChatMessages } from '@/components/expert/ExpertChatMessages';
import { ExpertWelcomeScreen } from '@/components/expert/ExpertWelcomeScreen';
import { ExpertHistoryPanel } from '@/components/expert/ExpertHistoryPanel';
import { isToday, isThisWeek, isThisMonth, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useManagedFilters } from '@/hooks/useManagedFilters';
import { ClearFiltersButton } from '@/components/filters/ClearFiltersButton';

interface LocalMessage {
  id: string; role: 'user' | 'assistant'; content: string; timestamp: Date; actions?: ExpertAction[]; actionsExecuted?: boolean;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/expert-agent`;

export default function Expert() {
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [executingActions, setExecutingActions] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const expertFilters = useManagedFilters<{ searchQuery: string; dateFilter: string }>({
    entityType: 'expert-history',
    defaults: { searchQuery: '', dateFilter: 'all' },
    localStorageKey: 'app-expert-history-filters',
  });
  const { searchQuery, dateFilter } = expertFilters.values;
  const setSearchQuery = (v: string) => expertFilters.setField('searchQuery', v);
  const setDateFilter = (v: string) => expertFilters.setField('dateFilter', v);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { resumoFinanceiro, isLoading: loadingContext } = useExpertContext();
  const { executeAction, parseActionsFromMessage, getCleanContent } = useExpertActions();
  const { data: conversations, isLoading: loadingConversations } = useExpertConversations();
  const { data: savedMessages } = useExpertMessages(currentConversationId);
  const createConversation = useCreateConversation();
  const updateConversation = useUpdateConversation();
  const deleteConversation = useDeleteConversation();
  const saveMessage = useSaveMessage();
  const updateMessageActions = useUpdateMessageActions();

  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    return conversations.filter(conv => {
      const matchesSearch = searchQuery === '' || conv.titulo.toLowerCase().includes(searchQuery.toLowerCase()) || (conv.resumo && conv.resumo.toLowerCase().includes(searchQuery.toLowerCase()));
      const convDate = new Date(conv.created_at);
      let matchesDate = true;
      switch (dateFilter) { case 'today': matchesDate = isToday(convDate); break; case 'week': matchesDate = isThisWeek(convDate, { locale: ptBR }); break; case 'month': matchesDate = isThisMonth(convDate); break; case 'older': matchesDate = convDate < subDays(new Date(), 30); break; }
      return matchesSearch && matchesDate;
    });
  }, [conversations, searchQuery, dateFilter]);

  useEffect(() => {
    if (savedMessages) setMessages(savedMessages.map((m: ExpertMessage) => ({ id: m.id, role: m.role, content: m.content, timestamp: new Date(m.created_at), actions: m.actions, actionsExecuted: m.actions_executed })));
  }, [savedMessages]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const copyToClipboard = async (text: string, id: string) => { await navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); toast.success('Copiado para a área de transferência'); };

  const handleExecuteActions = async (messageId: string, actions: ExpertAction[]) => {
    setExecutingActions(messageId);
    for (const action of actions) await executeAction(action);
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, actionsExecuted: true } : m));
    if (currentConversationId) updateMessageActions.mutate({ messageId, conversationId: currentConversationId });
    setExecutingActions(null);
  };

  const startNewConversation = () => { setCurrentConversationId(null); setMessages([]); setShowHistory(false); };
  const loadConversation = (id: string) => { setCurrentConversationId(id); setShowHistory(false); };
  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => { e.stopPropagation(); deleteConversation.mutate(id); if (currentConversationId === id) startNewConversation(); };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;
    let conversationId = currentConversationId;
    if (!conversationId) {
      try { const nc = await createConversation.mutateAsync(messageText.slice(0, 50)); conversationId = nc.id; setCurrentConversationId(conversationId); } catch (error: unknown) { logger.error('Error creating conversation:', error); toast.error('Erro ao criar conversa'); return; }
    }
    const userMessage: LocalMessage = { id: crypto.randomUUID(), role: 'user', content: messageText.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]); setInput(''); setIsLoading(true);
    try { const s = await saveMessage.mutateAsync({ conversation_id: conversationId, role: 'user', content: messageText.trim() }); userMessage.id = s.id; } catch (error: unknown) { logger.error('Error saving user message:', error); }

    let assistantContent = ''; const assistantId = crypto.randomUUID();
    try {
      const response = await fetch(CHAT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` }, body: JSON.stringify({ messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })), context: resumoFinanceiro }) });
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'Erro ao processar solicitação'); }
      if (!response.body) throw new Error('Resposta vazia');
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let textBuffer = '';
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', timestamp: new Date() }]);
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex); textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1); if (line.startsWith(':') || line.trim() === '') continue; if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim(); if (jsonStr === '[DONE]') break;
          try { const parsed = JSON.parse(jsonStr); const content = parsed.choices?.[0]?.delta?.content; if (content) { assistantContent += content; setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: assistantContent } : m)); } } catch { textBuffer = line + '\n' + textBuffer; break; }
        }
      }
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) { if (!raw) continue; if (raw.endsWith('\r')) raw = raw.slice(0, -1); if (raw.startsWith(':') || raw.trim() === '') continue; if (!raw.startsWith('data: ')) continue; const jsonStr = raw.slice(6).trim(); if (jsonStr === '[DONE]') continue; try { const parsed = JSON.parse(jsonStr); const content = parsed.choices?.[0]?.delta?.content; if (content) { assistantContent += content; setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: assistantContent } : m)); } } catch { /* ignore */ } }
      }
      const actions = parseActionsFromMessage(assistantContent); const cleanContent = getCleanContent(assistantContent);
      if (actions.length > 0) setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, actions, content: cleanContent } : m));
      try {
        const savedAssistantMsg = await saveMessage.mutateAsync({ conversation_id: conversationId, role: 'assistant', content: cleanContent || assistantContent, actions: actions.length > 0 ? actions : undefined });
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, id: savedAssistantMsg.id } : m));
        if (messages.length === 0) updateConversation.mutate({ id: conversationId, titulo: messageText.slice(0, 50) + (messageText.length > 50 ? '...' : ''), resumo: cleanContent?.slice(0, 100) });
      } catch (error: unknown) { logger.error('Error saving assistant message:', error); }
    } catch (error: unknown) { logger.error('Error:', error); toast.error(error instanceof Error ? error.message : 'Erro ao enviar mensagem'); setMessages(prev => prev.filter(m => m.id !== assistantId)); } finally { setIsLoading(false); }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(input); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } };

  return (
    <MainLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25"><Bot className="h-6 w-6 text-primary-foreground" /></div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">EXPERT<Badge variant="secondary" className="text-xs">IA</Badge></h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                Seu assistente inteligente para decisões financeiras
                {loadingContext ? <span className="flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Carregando dados...</span> : <span className="flex items-center gap-1 text-xs text-success"><Database className="h-3 w-3" />Dados atualizados</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)} className={cn(showHistory && "bg-muted")}>
              <History className="h-4 w-4 mr-2" />Histórico{conversations && conversations.length > 0 && <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">{conversations.length}</Badge>}
            </Button>
            {(messages.length > 0 || currentConversationId) && <Button variant="outline" size="sm" onClick={startNewConversation}><Plus className="h-4 w-4 mr-2" />Nova Conversa</Button>}
          </div>
        </div>

        <ExpertHistoryPanel
          show={showHistory}
          onClose={() => setShowHistory(false)}
          conversations={conversations || []}
          filteredConversations={filteredConversations}
          loadingConversations={loadingConversations}
          currentConversationId={currentConversationId}
          searchQuery={searchQuery}
          dateFilter={dateFilter}
          onSearchChange={setSearchQuery}
          onDateFilterChange={setDateFilter}
          onLoadConversation={loadConversation}
          onDeleteConversation={handleDeleteConversation}
          clearSlot={
            <ClearFiltersButton
              controller={expertFilters}
              entityLabel="histórico do expert"
              variant="ghost"
              size="sm"
              label="Limpar filtros"
              describeFilters={(v) => [
                { label: 'Busca', value: v.searchQuery, isActive: !!v.searchQuery },
                { label: 'Período', value: v.dateFilter, isActive: v.dateFilter !== 'all' },
              ]}
            />
          }
        />

        {messages.length === 0 && showSuggestions && <div className="mb-4"><ProactiveSuggestions onSuggestionClick={(s) => sendMessage(s)} /></div>}

        <Card className="flex-1 flex flex-col overflow-hidden border-2">
          {messages.length === 0 ? <ExpertWelcomeScreen onSendMessage={sendMessage} /> : <ExpertChatMessages messages={messages} scrollRef={scrollRef} copiedId={copiedId} executingActions={executingActions} onCopy={copyToClipboard} onExecuteActions={handleExecuteActions} />}

          <div className="p-4 border-t bg-card/50">
            <div className="max-w-3xl mx-auto">
              <Collapsible open={showDocumentUpload} onOpenChange={setShowDocumentUpload}>
                <div className="flex items-center gap-2 mb-3">
                  <CollapsibleTrigger asChild><Button variant="outline" size="sm" className="gap-2"><FileUp className="h-4 w-4" />Analisar Documento{showDocumentUpload ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</Button></CollapsibleTrigger>
                  <span className="text-xs text-muted-foreground">Upload de PDF, planilhas ou imagens para análise</span>
                </div>
                <CollapsibleContent className="mb-3"><DocumentAnalyzer onAnalysisComplete={(analysis) => { sendMessage(`Análise do documento:\n\n${analysis}`); setShowDocumentUpload(false); }} /></CollapsibleContent>
              </Collapsible>
              <form onSubmit={handleSubmit}>
                <div className="relative">
                  <Textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Digite sua pergunta para o EXPERT..." className="min-h-[60px] max-h-[200px] pr-14 resize-none" disabled={isLoading} />
                  <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="absolute right-2 bottom-2 h-10 w-10 rounded-xl">{isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}</Button>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">Pressione Enter para enviar ou Shift+Enter para nova linha</p>
              </form>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
