import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  artificialHistoryState,
  MODAL_HISTORY_MARKER,
  popTopModalMarkers,
  registerUnsavedGuard,
  UNSAVED_GUARD_SENTINEL as SENTINEL,
} from '@/lib/unsaved-guard';
import { UnsavedGuardContext } from './unsaved-guard-context';

export function UnsavedGuardProvider({ children }: { children: React.ReactNode }) {
  const dirtyRef = useRef(false);
  const sentinelActiveRef = useRef(false);
  // Pops que disparamos nós mesmos (sentinela + marcadores de modal):
  // o proceed pendente roda quando todos terminarem OU ao pousar numa
  // entrada real — nunca junto com os history.back(), o que faria duas
  // travessias competirem.
  const skipPopsRef = useRef(0);
  const awaitingPopRef = useRef(false);
  // Navegação que só pode rodar DEPOIS do pop da sentinela concluir —
  // chamar junto com history.back() faria dois "voltar" competirem.
  const pendingProceedRef = useRef<(() => void) | null>(null);
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const setDirty = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty;
    if (dirty && !sentinelActiveRef.current) {
      // Sentinela: o próximo "voltar" do browser cai nela, não sai da página.
      window.history.pushState(artificialHistoryState(SENTINEL), '');
      sentinelActiveRef.current = true;
    } else if (!dirty && sentinelActiveRef.current) {
      // Limpou sem navegar: remove a sentinela se ela ainda for o topo.
      if (window.history.state?.[SENTINEL]) {
        skipPopsRef.current = 1;
        window.history.back();
      }
      sentinelActiveRef.current = false;
    }
  }, []);

  const requestLeave = useCallback((proceed: () => void) => {
    setPendingLeave(() => proceed);
  }, []);

  // Registra handlers de módulo p/ navegação programática (BackButton etc.)
  useEffect(() => {
    registerUnsavedGuard({ isDirty: () => dirtyRef.current, requestLeave });
    return () => registerUnsavedGuard(null);
  }, [requestLeave]);

  // Intercepta cliques em links internos enquanto dirty.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!dirtyRef.current) return;
      // Cliques modificados (nova aba/janela) não saem da página atual.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const anchor = (e.target as HTMLElement).closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;
      const href = anchor.getAttribute('href') ?? '';
      if (!href.startsWith('/') || href.startsWith('//')) return;
      e.preventDefault();
      e.stopPropagation();
      requestLeave(() => {
        dirtyRef.current = false;
        navigate(href);
      });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [navigate, requestLeave]);

  // Voltar do browser: a sentinela é estourada; pedimos confirmação.
  useEffect(() => {
    const onPopState = () => {
      if (skipPopsRef.current > 0) {
        skipPopsRef.current -= 1;
        const s = window.history.state as Record<string, unknown> | null;
        const onRealEntry = !(s?.[SENTINEL] || s?.[MODAL_HISTORY_MARKER]);
        if (skipPopsRef.current <= 0 || onRealEntry) {
          skipPopsRef.current = 0;
          // Todos os pops artificiais concluídos: agora navega de verdade.
          const proceed = pendingProceedRef.current;
          pendingProceedRef.current = null;
          proceed?.();
        }
        return;
      }
      if (!dirtyRef.current) return;
      if (awaitingPopRef.current) {
        // Pop extra enquanto a confirmação está aberta: desfaz para não sair da página.
        window.history.forward();
        return;
      }
      // Pop que chegou ATÉ a sentinela (havia um marcador de modal ou
      // rota acima dela): esse Voltar pertencia ao que estava acima, não
      // é tentativa de sair — a guarda só dispara ao cruzar abaixo dela.
      if (window.history.state?.[SENTINEL]) return;
      sentinelActiveRef.current = false;
      awaitingPopRef.current = true;
      setPendingLeave(() => () => {
        awaitingPopRef.current = false;
        dirtyRef.current = false;
        window.history.back();
      });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Confirmação nativa ao fechar/recarregar a aba.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // Mudança de rota efetivada limpa o estado sujo (a página desmontou).
  useEffect(() => {
    if (dirtyRef.current) {
      dirtyRef.current = false;
      sentinelActiveRef.current = false;
    }
  }, [location.key]);

  const confirmLeave = () => {
    const proceed = pendingLeave;
    setPendingLeave(null);
    dirtyRef.current = false;
    // Se a sentinela ainda é o topo (saída via link/botão, não via back do
    // browser que já a estourou), remove-a antes de navegar — senão um
    // navigate(-1) subsequente cairia nela e ficaria na mesma página.
    if (sentinelActiveRef.current) {
      sentinelActiveRef.current = false;
      if (window.history.state?.[SENTINEL]) {
        // Serializa: marcadores de modal logo abaixo da sentinela (form
        // em dialog) + a própria sentinela saem primeiro; o proceed só
        // roda no popstate do último — senão as travessias competiriam
        // e ultrapassariam o destino.
        const n = popTopModalMarkers();
        pendingProceedRef.current = proceed ?? null;
        skipPopsRef.current = 1 + n;
        window.history.back();
        return;
      }
    }
    // Voltar do browser já estourou a sentinela: consome os marcadores
    // de modal no topo e aguarda todos os pops antes do proceed — as
    // travessias assíncronas não podem competir entre si.
    const n = popTopModalMarkers();
    if (n > 0) {
      pendingProceedRef.current = proceed ?? null;
      skipPopsRef.current = n;
      return;
    }
    proceed?.();
  };

  const dismissLeave = () => {
    setPendingLeave(null);
    // Cancelou um "voltar" do browser: repõe a sentinela para o próximo.
    if (awaitingPopRef.current && dirtyRef.current) {
      awaitingPopRef.current = false;
      window.history.pushState(artificialHistoryState(SENTINEL), '');
      sentinelActiveRef.current = true;
    }
  };

  return (
    <UnsavedGuardContext.Provider value={{ setDirty }}>
      {children}
      <AlertDialog open={pendingLeave !== null} onOpenChange={(open) => !open && dismissLeave()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações não salvas?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas nesta tela. Se sair agora, elas serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={dismissLeave}>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLeave}>Descartar e sair</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UnsavedGuardContext.Provider>
  );
}
