import { useState, useCallback } from 'react';

interface UseCopyToClipboardReturn {
  copiedText: string | null;
  isCopied: boolean;
  copy: (text: string) => Promise<boolean>;
  reset: () => void;
}

/**
 * Hook para copiar texto para área de transferência
 * @param resetDelay - Tempo em ms para resetar estado (default: 2000)
 */
export function useCopyToClipboard(resetDelay: number = 2000): UseCopyToClipboardReturn {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const reset = useCallback(() => {
    setCopiedText(null);
    setIsCopied(false);
  }, []);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (!navigator?.clipboard) {
        console.warn('Clipboard API não disponível');
        
        // Fallback para execCommand
        try {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.position = 'fixed';
          textarea.style.left = '-9999px';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          
          setCopiedText(text);
          setIsCopied(true);
          
          if (resetDelay > 0) {
            setTimeout(reset, resetDelay);
          }
          
          return true;
        } catch (err) {
          console.error('Fallback copy failed:', err);
          return false;
        }
      }

      try {
        await navigator.clipboard.writeText(text);
        setCopiedText(text);
        setIsCopied(true);

        if (resetDelay > 0) {
          setTimeout(reset, resetDelay);
        }

        return true;
      } catch (err) {
        console.error('Failed to copy:', err);
        setCopiedText(null);
        setIsCopied(false);
        return false;
      }
    },
    [resetDelay, reset]
  );

  return {
    copiedText,
    isCopied,
    copy,
    reset,
  };
}

/**
 * Hook para copiar com callback
 */
export function useCopyWithCallback(
  onSuccess?: (text: string) => void,
  onError?: (error: Error) => void
) {
  const { copy, ...state } = useCopyToClipboard();

  const copyWithCallback = useCallback(
    async (text: string) => {
      try {
        const success = await copy(text);
        if (success) {
          onSuccess?.(text);
        } else {
          onError?.(new Error('Falha ao copiar'));
        }
        return success;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        onError?.(error);
        return false;
      }
    },
    [copy, onSuccess, onError]
  );

  return {
    ...state,
    copy: copyWithCallback,
  };
}

/**
 * Hook para ler da área de transferência
 */
export function useReadFromClipboard() {
  const [text, setText] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const read = useCallback(async (): Promise<string | null> => {
    if (!navigator?.clipboard) {
      setError(new Error('Clipboard API não disponível'));
      return null;
    }

    setIsReading(true);
    setError(null);

    try {
      const clipboardText = await navigator.clipboard.readText();
      setText(clipboardText);
      return clipboardText;
    } catch (err) {
      const readError = err instanceof Error ? err : new Error(String(err));
      setError(readError);
      return null;
    } finally {
      setIsReading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setText(null);
    setError(null);
  }, []);

  return {
    text,
    isReading,
    error,
    read,
    clear,
  };
}
