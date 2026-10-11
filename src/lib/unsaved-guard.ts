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
 * Popper registrado pelo ModalHistoryManager: consome os marcadores de
 * modal contíguos do topo do histórico. Chamado pela guarda ao confirmar
 * uma saída, para que a navegação real não pare no marcador do dialog.
 */
type ModalMarkerPopper = () => number;

let modalMarkerPopper: ModalMarkerPopper | null = null;

export function registerModalMarkerPopper(popper: ModalMarkerPopper | null): () => void {
  modalMarkerPopper = popper;
  return () => {
    if (modalMarkerPopper === popper) modalMarkerPopper = null;
  };
}

/** Remove os marcadores de modal do topo; retorna quantos pops enfileirou. */
export function popTopModalMarkers(): number {
  return modalMarkerPopper?.() ?? 0;
}
