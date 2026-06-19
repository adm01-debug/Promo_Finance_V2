/**
 * Console guard — silencia console.log/debug/info em produção.
 * Preserva console.warn e console.error para observabilidade (telemetria/Sentry).
 *
 * Importar este módulo o mais cedo possível em main.tsx, antes de qualquer
 * outra inicialização que possa emitir logs.
 */

if (!import.meta.env.DEV) {
  const noop = (): void => {
    /* no-op em produção */
  };

  // Mantemos warn/error para que erros continuem visíveis em produção.
  /* eslint-disable no-console */
  console.log = noop;
  console.debug = noop;
  console.info = noop;
  console.trace = noop;
  console.table = noop;
  console.dir = noop;
  console.group = noop;
  console.groupCollapsed = noop;
  console.groupEnd = noop;
  /* eslint-enable no-console */
}

export {};
