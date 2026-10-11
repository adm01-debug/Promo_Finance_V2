/**
 * Guarda global de alterações não salvas — nível de módulo para que
 * navegadores programáticos (BackButton, swipe, teclado) consultem o
 * estado sujo sem acoplamento a contexto React. O provider React em
 * `components/navigation/UnsavedGuardProvider.tsx` preenche os handlers.
 */

/** Chaves de `history.state` usadas pelas entradas artificiais de navegação. */
export const MODAL_HISTORY_MARKER = '__modal_history__';
export const UNSAVED_GUARD_SENTINEL = '__unsaved_guard__';

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
