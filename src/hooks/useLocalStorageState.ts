import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hook tipado para persistir estado de UI no localStorage.
 *
 * - SSR-safe: lê o valor inicial só após o mount.
 * - Tolerante a JSON inválido / quota cheia / contextos sem `window`.
 * - Sincroniza entre abas via evento `storage`.
 *
 * Uso típico: lembrar preferências do usuário (chips visíveis, modo de
 * visualização, filtros) entre sessões.
 */
export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const initialRef = useRef(initialValue);
  const [value, setValue] = useState<T>(initialValue);
  const hydrated = useRef(false);

  // Hidrata do localStorage no mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        setValue(JSON.parse(raw) as T);
      }
    } catch {
      // valor corrompido — mantém initialValue
    } finally {
      hydrated.current = true;
    }
  }, [key]);

  // Persiste alterações
  useEffect(() => {
    if (!hydrated.current) return;
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // quota cheia ou storage indisponível
    }
  }, [key, value]);

  // Sincroniza entre abas
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: StorageEvent) => {
      if (e.key !== key || e.newValue === null) return;
      try {
        setValue(JSON.parse(e.newValue) as T);
      } catch {
        // ignora
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [key]);

  const reset = useCallback(() => {
    setValue(initialRef.current);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    }
  }, [key]);

  return [value, setValue, reset];
}
