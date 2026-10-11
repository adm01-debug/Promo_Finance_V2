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
  popTopModalMarkers,
  registerUnsavedGuard,
  UNSAVED_GUARD_SENTINEL as SENTINEL,
} from '@/lib/unsaved-guard';
import { UnsavedGuardContext } from './unsaved-guard-context';

export function UnsavedGuardProvider({ children }: { children: React.ReactNode }) {
  const dirtyRef = useRef(false);
  const sentinelActiveRef = useRef(false);
  const skipPopRef = useRef(false);
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
        skipPopRef.current = true;
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
      if (skipPopRef.current) {
        skipPopRef.current = false;
        // Pop da nossa própria remoção de sentinela: concluída, agora navega.
        const proceed = pendingProceedRef.current;
        pendingProceedRef.current = null;
        proceed?.();
        return;
      }
      if (!dirtyRef.current) return;
      if (awaitingPopRef.current) {
        // Pop extra enquanto a confirmação está aberta: desfaz para não sair da página.
        window.history.forward();
        return;
      }
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
        // Serializa: executa proceed apenas quando o pop da sentinela voltar
        // (flag skipPopRef no handler de popstate), senão dois "voltar"
        // competiriam e a navegação ultrapassaria o destino.
        pendingProceedRef.current = proceed ?? null;
        skipPopRef.current = true;
        window.history.back();
        // Marcadores de modal logo abaixo da sentinela (form em dialog):
        // consome-os também, senão o proceed (navigate(-1)) pararia no
        // marcador e o Voltar confirmado só fecharia o formulário.
        popTopModalMarkers();
        return;
      }
    }
    // Voltar do browser já estourou a sentinela: os marcadores de modal
    // estão no topo — consome-os antes da navegação real.
    popTopModalMarkers();
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
