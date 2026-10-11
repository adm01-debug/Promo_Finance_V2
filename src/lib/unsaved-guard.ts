/**
 * Guarda global de alterações não salvas — nível de módulo para que
 * navegadores programáticos (BackButton, swipe, teclado) consultem o
 * estado sujo sem acoplamento a contexto React. O provider React em
 * `components/navigation/UnsavedGuardProvider.tsx` preenche os handlers.
 */

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
