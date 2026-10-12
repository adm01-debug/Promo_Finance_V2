/**
 * Guarda global de alterações não salvas — nível de módulo para que
 * navegadores programáticos (BackButton, swipe, teclado) consultem o
 * estado sujo sem acoplamento a contexto React. O provider React em
 * `components/navigation/UnsavedGuardProvider.tsx` preenche os handlers.
 */

/** Chaves de `history.state` usadas pelas entradas artificiais de navegação. */
export const MODAL_HISTORY_MARKER = '__modal_history__';
export const UNSAVED_GUARD_SENTINEL = '__unsaved_guard__';
/** Seletor dos dialogs que participam do histórico e do roteamento de Escape. */
export const OPEN_DIALOG_SELECTOR = '[role="dialog"][data-state="open"]';

/**
 * State para uma entrada artificial: preserva idx/key do React Router e
 * remove marcadores herdados (o marcador vale só para a entrada que o criou).
 */
export function artificialHistoryState(marker: string): Record<string, unknown> {
  const current = window.history.state;
  const base: Record<string, unknown> =
    current && typeof current === 'object' ? { ...(current as Record<string, unknown>) } : {};
  delete base[MODAL_HISTORY_MARKER];
  delete base[UNSAVED_GUARD_SENTINEL];
  base[marker] = true;
  return base;
}

export interface UnsavedGuardHandlers {
  isDirty: () => boolean;
  /** Exibe confirmação; chama `proceed` se o usuário aceitar sair. */
  requestLeave: (proceed: () => void) => void;
}

let handlers: UnsavedGuardHandlers | null = null;

export function registerUnsavedGuard(h: UnsavedGuardHandlers | null): void {
  handlers = h;
}

/** True quando há trabalho não salvo na tela atual. */
export function hasUnsavedChanges(): boolean {
  return handlers?.isDirty() ?? false;
}

/**
 * Executa `proceed` imediatamente se não houver alterações não salvas;
 * caso contrário delega a confirmação ao provider.
 */
export function navigateWithUnsavedGuard(proceed: () => void): void {
  if (!handlers || !handlers.isDirty()) {
    proceed();
    return;
  }
  handlers.requestLeave(proceed);
}

/**
 * Contador registrado pelo ModalHistoryManager: quantos marcadores de
 * modal formam o bloco contíguo do topo do histórico. A guarda usa a
 * contagem para planejar os pops ao confirmar uma saída — os history.
 * back() são emitidos por ela, um por popstate, porque travessias
 * síncronas consecutivas podem ser coalescidas pelo browser.
 */
type ModalMarkerCounter = () => number;

let modalMarkerCounter: ModalMarkerCounter | null = null;

export function registerModalMarkerPopper(counter: ModalMarkerCounter | null): () => void {
  modalMarkerCounter = counter;
  return () => {
    if (modalMarkerCounter === counter) modalMarkerCounter = null;
  };
}

/** Quantos marcadores de modal formam o bloco contíguo do topo (0 se soterrados). */
export function topModalMarkerCount(): number {
  return modalMarkerCounter?.() ?? 0;
}

/**
 * Pergunta registrada pelo provider: true enquanto uma sequência de pops
 * planejados pela confirmação de saída está em andamento (inclui o pop em
 * que o `proceed` roda — a flag só cai em microtask, depois dos listeners
 * de popstate do evento). O ModalHistoryManager usa isto para não despachar
 * Escape em pops que não vieram do usuário.
 */
type PlannedPopChecker = () => boolean;

let plannedPopChecker: PlannedPopChecker | null = null;

export function registerPlannedPopChecker(checker: PlannedPopChecker | null): () => void {
  plannedPopChecker = checker;
  return () => {
    if (plannedPopChecker === checker) plannedPopChecker = null;
  };
}

export function isPlannedGuardPop(): boolean {
  return plannedPopChecker?.() ?? false;
}

/**
 * Pergunta registrada pelo provider: true enquanto a confirmação de
 * saída aguarda resposta — o Voltar seguinte será desfeito com
 * forward(), então a entrada não sai do histórico. O
 * ModalHistoryManager usa isto para não consumir o marcador nesses
 * pops: diferente dos pops planejados (que de fato removem entradas),
 * aqui o marcador e o dialog devem permanecer.
 */
type AwaitingPopChecker = () => boolean;

let awaitingPopChecker: AwaitingPopChecker | null = null;

export function registerAwaitingPopChecker(checker: AwaitingPopChecker | null): () => void {
  awaitingPopChecker = checker;
  return () => {
    if (awaitingPopChecker === checker) awaitingPopChecker = null;
  };
}

export function isGuardAwaitingPop(): boolean {
  return awaitingPopChecker?.() ?? false;
}

/**
 * Resync registrado pelo ModalHistoryManager: chamado quando entradas
 * artificiais são (re)empilhadas e dialogs abertos podem ter ficado
 * sem marcador — o pushMarker recusado por hasForwardEntries, ou o
 * marcador consumido por um pop planejado cujo back() final foi no-op.
 * Digitar num input não dispara o MutationObserver, então sem este
 * sinal o dialog permaneceria fora do histórico.
 */
type MarkerResync = () => void;

let markerResync: MarkerResync | null = null;

export function registerMarkerResync(resync: MarkerResync | null): () => void {
  markerResync = resync;
  return () => {
    if (markerResync === resync) markerResync = null;
  };
}

export function requestMarkerResync(): void {
  markerResync?.();
}

/**
 * Pergunta registrada pelo ModalHistoryManager: o elemento é o dialog
 * do topo pela ordem real de ABERTURA? A ordem do DOM mente — o
 * portal do Radix vai para o body depois do root onde um dialog
 * próprio (ConfirmationDialog e cia.) foi renderizado antes, então
 * comparar com a última posição do DOM deixava o Escape retargetado
 * sem efeito. Sem gerenciador montado (ex.: testes), cai na última
 * posição do DOM como fallback.
 */
type TopDialogChecker = (el: HTMLElement) => boolean;

let topDialogChecker: TopDialogChecker | null = null;

export function registerTopDialogChecker(checker: TopDialogChecker | null): () => void {
  topDialogChecker = checker;
  return () => {
    if (topDialogChecker === checker) topDialogChecker = null;
  };
}

export function isTopOpenDialog(el: HTMLElement): boolean {
  if (topDialogChecker) return topDialogChecker(el);
  const dialogs = document.querySelectorAll(OPEN_DIALOG_SELECTOR);
  return dialogs[dialogs.length - 1] === el;
}
