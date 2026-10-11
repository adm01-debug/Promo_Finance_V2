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
  registerPlannedPopChecker,
  registerUnsavedGuard,
  topModalMarkerCount,
  UNSAVED_GUARD_SENTINEL as SENTINEL,
} from '@/lib/unsaved-guard';
import { UnsavedGuardContext } from './unsaved-guard-context';

export function UnsavedGuardProvider({ children }: { children: React.ReactNode }) {
  const dirtyRef = useRef(false);
  const sentinelActiveRef = useRef(false);
  // Pops artificiais pendentes (sentinela + marcadores de modal): um
  // history.back() por popstate — vários backs síncronos podem ser
  // coalescidos pelo browser (WebKit bug 313808) e o proceed nunca
  // rodaria. O proceed pendente roda quando o último pop chega OU ao
  // pousar numa entrada real.
  const plannedPopsRef = useRef(0);
  const arrivedPopsRef = useRef(0);
  const awaitingPopRef = useRef(false);
  // Marca o pop do nosso próprio back() de saída confirmada — o popstate
  // dele não pode ser reinterpretado como nova tentativa de sair.
  const leavingOwnPopRef = useRef(false);
  // AlertDialogAction dispara onOpenChange(false) depois do onClick:
  // sem a flag, o fechamento do botão "Descartar" cai no dismissLeave e
  // repõe uma sentinela no meio dos pops planejados.
  const confirmedRef = useRef(false);
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
        plannedPopsRef.current = 1;
        arrivedPopsRef.current = 0;
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

  // O ModalHistoryManager pergunta isto para não despachar Escape nos pops
  // que a própria guarda planejou — senão a confirmação de descarte
  // reapareceria no form que ela está fechando.
  useEffect(
    () =>
      registerPlannedPopChecker(
        () => plannedPopsRef.current > 0 || pendingProceedRef.current !== null
      ),
    []
  );

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
      // Destino = a própria rota (NavLink ativo, item atual da paleta):
      // o form não desmonta e nada é descartado — deixa o clique seguir.
      if (href.split('?')[0].split('#')[0] === location.pathname) return;
      e.preventDefault();
      e.stopPropagation();
      requestLeave(() => {
        dirtyRef.current = false;
        navigate(href);
      });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [navigate, requestLeave, location.pathname]);

  // Voltar do browser: a sentinela é estourada; pedimos confirmação.
  useEffect(() => {
    const onPopState = () => {
      if (plannedPopsRef.current > 0) {
        arrivedPopsRef.current += 1;
        const s = window.history.state as Record<string, unknown> | null;
        const onRealEntry = !(s?.[SENTINEL] || s?.[MODAL_HISTORY_MARKER]);
        if (arrivedPopsRef.current >= plannedPopsRef.current || onRealEntry) {
          plannedPopsRef.current = 0;
          arrivedPopsRef.current = 0;
          // Todos os pops artificiais concluídos: agora navega de verdade.
          // pendingProceed só zera em microtask — outros listeners deste
          // mesmo popstate ainda veem a sequência como planejada.
          const proceed = pendingProceedRef.current;
          proceed?.();
          queueMicrotask(() => {
            pendingProceedRef.current = null;
          });
        } else {
          // Um back por popstate: backs síncronos podem ser coalescidos.
          window.history.back();
        }
        return;
      }
      // Pop do back() emitido pelo proceed de saída confirmada: a
      // sujeira só limpa quando a página de fato trocar (efeito de
      // localização) — reinterpretar aqui pediria confirmação de novo.
      if (leavingOwnPopRef.current) {
        leavingOwnPopRef.current = false;
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
        const before = window.history.state;
        leavingOwnPopRef.current = true;
        window.history.back();
        // Rota aberta direto (sem entrada anterior real): o back() é
        // no-op e o form segue montado e sujo — rearma a sentinela,
        // senão a próxima saída descartaria as edições sem aviso.
        window.setTimeout(() => {
          if (window.history.state === before && dirtyRef.current && !sentinelActiveRef.current) {
            window.history.pushState(artificialHistoryState(SENTINEL), '');
            sentinelActiveRef.current = true;
          }
        }, 150);
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

  // Mudança de página efetivada limpa o estado sujo (o form desmontou).
  // REPLACE de mesma página (ex.: remover ?highlight da query) muda a
  // key mas não desmonta o form — a guarda tem que continuar armada.
  const lastPathnameRef = useRef(location.pathname);
  useEffect(() => {
    if (location.pathname === lastPathnameRef.current) {
      // Navegação confirmada para a própria rota (link/paleta na página
      // atual): o form não desmontou e continua sujo — repõe a sentinela
      // que o fluxo de saída consumiu, senão a próxima saída descarta
      // as edições sem aviso.
      if (dirtyRef.current && !sentinelActiveRef.current) {
        window.history.pushState(artificialHistoryState(SENTINEL), '');
        sentinelActiveRef.current = true;
      }
      return;
    }
    lastPathnameRef.current = location.pathname;
    if (dirtyRef.current) {
      dirtyRef.current = false;
      sentinelActiveRef.current = false;
    }
  }, [location.key, location.pathname]);

  const confirmLeave = () => {
    confirmedRef.current = true;
    const proceed = pendingLeave;
    setPendingLeave(null);
    // dirtyRef NÃO é limpo aqui: se o destino for a própria rota o form
    // segue montado e sujo — o efeito de localização rearma a sentinela.
    // Em saída real, a mudança de pathname faz o reset.
    // Posição real no histórico decide o caminho — a flag pode estar
    // dessincronizada (Voltar extra desfeito por forward pousou de novo
    // na sentinela com sentinelActiveRef já limpo).
    if (window.history.state?.[SENTINEL]) {
      sentinelActiveRef.current = false;
      // Sentinela no topo (saída via link/atalho): ela e os marcadores
      // saem primeiro, um back por popstate; o proceed roda no último.
      const n = topModalMarkerCount();
      pendingProceedRef.current = proceed ?? null;
      plannedPopsRef.current = 1 + n;
      arrivedPopsRef.current = 0;
      window.history.back();
      return;
    }
    const stillSentinel = sentinelActiveRef.current;
    sentinelActiveRef.current = false;
    // Voltar do browser já estourou a sentinela: consome os marcadores
    // que ainda formam o topo antes da navegação real. Com a sentinela
    // ainda empilhada sob eles (saída por link/fechar dialog), some-a ao
    // plano — do contrário sobrava uma entrada morta e o próximo Voltar
    // parecia não fazer nada.
    const n = topModalMarkerCount() + (stillSentinel ? 1 : 0);
    if (n > 0) {
      pendingProceedRef.current = proceed ?? null;
      plannedPopsRef.current = n;
      arrivedPopsRef.current = 0;
      window.history.back();
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
      <AlertDialog
        open={pendingLeave !== null}
        onOpenChange={(open) => {
          if (open) return;
          // O AlertDialogAction também fecha o Radix após o onClick —
          // esse fechamento é da confirmação, não de um cancelamento.
          if (confirmedRef.current) {
            confirmedRef.current = false;
            return;
          }
          dismissLeave();
        }}
      >
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
