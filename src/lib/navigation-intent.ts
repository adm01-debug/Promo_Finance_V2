export interface NovoRegistroNavigationState {
  openNewRecord: true;
}

export function navegarParaNovoRegistro(): NovoRegistroNavigationState {
  return { openNewRecord: true };
}

export function deveAbrirNovoRegistro(state: unknown): state is NovoRegistroNavigationState {
  return (
    typeof state === 'object' &&
    state !== null &&
    (state as Record<string, unknown>).openNewRecord === true
  );
}
