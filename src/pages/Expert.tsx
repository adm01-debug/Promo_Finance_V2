import { useState, useRef, useEffect, useMemo } from 'react';
import { Bot, Loader2, History, Plus, Database } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/layout/MainLayout';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
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
  ExpertMessage,
} from '@/hooks/useExpertConversations';
import { ExpertPromptComposer } from '@/components/expert/ExpertPromptComposer';
import { ProactiveSuggestions } from '@/components/expert/ProactiveSuggestions';
import { ExpertChatMessages } from '@/components/expert/ExpertChatMessages';
import { ExpertWelcomeScreen } from '@/components/expert/ExpertWelcomeScreen';
import { ExpertHistoryPanel } from '@/components/expert/ExpertHistoryPanel';
import { useManagedFilters } from '@/hooks/useManagedFilters';
import { ClearFiltersButton } from '@/components/filters/ClearFiltersButton';
import { supabase } from '@/integrations/supabase/client';
import { useQueuedMessage } from '@/hooks/useQueuedMessage';
import {
  EXPERT_CHAT_URL,
  filtrarConversasExpert,
  type LocalExpertMessage,
} from '@/components/expert/expertPageSupport';

export default function Expert() {
  const [messages, setMessages] = useState<LocalExpertMessage[]>([]);
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
  const [showSuggestions] = useState(true);
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

  const filteredConversations = useMemo(
    () => filtrarConversasExpert(conversations, searchQuery, dateFilter),
    [conversations, searchQuery, dateFilter]
  );

  useEffect(() => {
    if (savedMessages)
      setMessages(
        savedMessages.map((m: ExpertMessage) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.created_at),
          actions: m.actions,
          actionsExecuted: m.actions_executed,
        }))
      );
  }, [savedMessages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Copiado para a área de transferência');
  };

  const handleExecuteActions = async (messageId: string, actions: ExpertAction[]) => {
    setExecutingActions(messageId);
    for (const action of actions) await executeAction(action);
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, actionsExecuted: true } : m))
    );
    if (currentConversationId)
      updateMessageActions.mutate({ messageId, conversationId: currentConversationId });
    setExecutingActions(null);
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setShowHistory(false);
  };
  const loadConversation = (id: string) => {
    setCurrentConversationId(id);
    setShowHistory(false);
  };
  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation.mutate(id);
    if (currentConversationId === id) startNewConversation();
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;
    let conversationId = currentConversationId;
    if (!conversationId) {
      try {
        const nc = await createConversation.mutateAsync(messageText.slice(0, 50));
        conversationId = nc.id;
        setCurrentConversationId(conversationId);
      } catch (error: unknown) {
        logger.error('Error creating conversation:', error);
        toast.error('Erro ao criar conversa');
        return;
      }
    }
    const userMessage: LocalExpertMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    try {
      const s = await saveMessage.mutateAsync({
        conversation_id: conversationId,
        role: 'user',
        content: messageText.trim(),
      });
      userMessage.id = s.id;
    } catch (error: unknown) {
      logger.error('Error saving user message:', error);
    }

    let assistantContent = '';
    const assistantId = crypto.randomUUID();
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        throw new Error('Sua sessão expirou. Faça login novamente para usar o EXPERT.');
      }

      const response = await fetch(EXPERT_CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
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
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', timestamp: new Date() },
      ]);
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
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: assistantContent } : m))
              );
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
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
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: assistantContent } : m))
              );
            }
          } catch {
            /* ignore */
          }
        }
      }
      const actions = parseActionsFromMessage(assistantContent);
      const cleanContent = getCleanContent(assistantContent);
      if (actions.length > 0)
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, actions, content: cleanContent } : m))
        );
      try {
        const savedAssistantMsg = await saveMessage.mutateAsync({
          conversation_id: conversationId,
          role: 'assistant',
          content: cleanContent || assistantContent,
          actions: actions.length > 0 ? actions : undefined,
        });
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, id: savedAssistantMsg.id } : m))
        );
        if (messages.length === 0)
          updateConversation.mutate({
            id: conversationId,
            titulo: messageText.slice(0, 50) + (messageText.length > 50 ? '...' : ''),
            resumo: cleanContent?.slice(0, 100),
          });
      } catch (error: unknown) {
        logger.error('Error saving assistant message:', error);
      }
    } catch (error: unknown) {
      logger.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar mensagem');
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setIsLoading(false);
    }
  };

  const enfileirarMensagem = useQueuedMessage(isLoading, sendMessage);

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

  return (
    <MainLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                EXPERT
                <Badge variant="secondary" className="text-xs">
                  IA
                </Badge>
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
              className={cn(showHistory && 'bg-muted')}
            >
              <History className="h-4 w-4 mr-2" />
              Histórico
              {conversations && conversations.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
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

        {messages.length === 0 && showSuggestions && (
          <div className="mb-4">
            <ProactiveSuggestions onSuggestionClick={(s) => sendMessage(s)} />
          </div>
        )}

        <Card className="flex-1 flex flex-col overflow-hidden border-2">
          {messages.length === 0 ? (
            <ExpertWelcomeScreen onSendMessage={sendMessage} />
          ) : (
            <ExpertChatMessages
              messages={messages}
              scrollRef={scrollRef}
              copiedId={copiedId}
              executingActions={executingActions}
              onCopy={copyToClipboard}
              onExecuteActions={handleExecuteActions}
            />
          )}

          <ExpertPromptComposer
            input={input}
            isLoading={isLoading}
            textareaRef={textareaRef}
            showDocumentUpload={showDocumentUpload}
            onInputChange={setInput}
            onInputKeyDown={handleKeyDown}
            onSubmit={handleSubmit}
            onShowDocumentUploadChange={setShowDocumentUpload}
            onDocumentAnalysisComplete={(analysis) => {
              const mensagem = `Análise do documento:\n\n${analysis}`;
              if (isLoading) {
                enfileirarMensagem(mensagem);
                toast.info('Análise enfileirada para envio');
              } else {
                void sendMessage(mensagem);
              }
              setShowDocumentUpload(false);
            }}
          />
        </Card>
      </div>
    </MainLayout>
  );
}
