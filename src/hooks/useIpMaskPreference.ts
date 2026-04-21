import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'lov:ip-mask-enabled';

/**
 * Preferência local do operador para mascarar `ip_address` em listas e
 * detalhes administrativos. Persistido em localStorage e sincronizado
 * entre abas pelo `useLocalStorage`.
 */
export function useIpMaskPreference() {
  const [enabled, setEnabled] = useLocalStorage<boolean>(STORAGE_KEY, false);

  return {
    enabled,
    setEnabled,
    toggle: () => setEnabled((v) => !v),
  };
}
