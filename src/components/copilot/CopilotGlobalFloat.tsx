import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Send, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

type Msg = { role: 'user' | 'assistant'; content: string };

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function renderMarkdown(text: string): string {
  let html = escapeHtml(text);
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-muted p-2 rounded text-xs overflow-x-auto"><code>$1</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 rounded text-xs">$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul class="list-disc pl-4 space-y-1">$1</ul>');
  html = html.replace(/\n/g, '<br />');
  return html;
}

function detectarContexto(pathname: string): string {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.includes('tributari') || pathname.includes('reforma')) return 'tributario';
  return 'financeiro';
}

function sugestoesPorContexto(contexto: string): string[] {
  if (contexto === 'tributario') {
    return [
      'Resuma minha apuração tributária do mês.',
      'Quais créditos estão disponíveis?',
      'Qual a carga tributária efetiva atual?',
    ];
  }
  if (contexto === 'admin') {
    return [
      'Como está a saúde do sistema?',
      'Quais anomalias críticas detectadas?',
      'Status das automações nas últimas 24h.',
    ];
  }
  return [
    'Resumo do dia.',
    'Quais ações urgentes pendentes?',
    'Qual meu saldo líquido projetado?',
  ];
}

export function CopilotGlobalFloat() {
  const location = useLocation();
  const contexto = detectarContexto(location.pathname);
  const storageKey = `copilot_global_history_${contexto}_v1`;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      setMessages(raw ? JSON.parse(raw) : []);
    } catch {
      setMessages([]);
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      // ignore
    }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, storageKey]);

  const enviar = async (texto: string) => {
    const conteudo = texto.trim();
    if (!conteudo || streaming) return;

    const novoMsg: Msg = { role: 'user', content: conteudo };
    setMessages((prev) => [...prev, novoMsg, { role: 'assistant', content: '' }]);
    setInput('');
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/copilot-global`;
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Sessão expirada — refaça login.');

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          contexto_pagina: contexto,
          messages: [...messages, novoMsg],
        }),
        signal: controller.signal,
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error('Limite de requisições. Tente em alguns segundos.');
        else if (resp.status === 402) toast.error('Créditos de IA esgotados.');
        else if (resp.status === 403) toast.error('Sem permissão para usar o Copilot.');
        else toast.error('Erro ao iniciar conversa.');
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line || line.startsWith(':')) continue;
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last?.role === 'assistant') {
                  copy[copy.length - 1] = { ...last, content: last.content + delta };
                }
                return copy;
              });
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        logger.error('Copilot global falhou', err as Error);
        toast.error('Conexão interrompida.');
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const limpar = () => {
    setMessages([]);
    sessionStorage.removeItem(storageKey);
  };

  const sugestoes = sugestoesPorContexto(contexto);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-24 right-4 md:bottom-20 md:right-20 z-40 rounded-full h-14 w-14 shadow-2xl bg-gradient-to-br from-primary to-primary/70 hover:scale-105 transition-transform p-0"
          aria-label="Abrir Copilot Global"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" /> Copilot Global
            </SheetTitle>
            {messages.length > 0 && (
              <Button variant="ghost" size="icon" onClick={limpar} aria-label="Limpar histórico">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground text-left">
            Assistente IA contextual · {contexto}
          </p>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Pergunte algo ou comece com uma sugestão:</p>
              {sugestoes.map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-2 whitespace-normal"
                  onClick={() => enviar(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                  m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                }`}
              >
                {m.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content || '...') }} />
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t bg-background">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte ao Copilot..."
              className="min-h-[44px] max-h-32 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  enviar(input);
                }
              }}
              disabled={streaming}
            />
            <Button
              onClick={() => enviar(input)}
              disabled={streaming || !input.trim()}
              size="icon"
              className="h-11 w-11 shrink-0"
              aria-label="Enviar"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
