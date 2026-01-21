import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UseClipboardOptions {
  timeout?: number;
  onSuccess?: (text: string) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

interface UseClipboardReturn {
  copy: (text: string) => Promise<boolean>;
  paste: () => Promise<string | null>;
  copied: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * Hook for clipboard operations
 */
export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const {
    timeout = 2000,
    onSuccess,
    onError,
    showToast = true,
    successMessage = 'Copiado para a área de transferência!',
    errorMessage = 'Falha ao copiar para a área de transferência',
  } = options;

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (!navigator?.clipboard) {
        const err = new Error('Clipboard API não disponível');
        setError(err);
        onError?.(err);
        if (showToast) {
          toast.error(errorMessage);
        }
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setError(null);
        onSuccess?.(text);
        
        if (showToast) {
          toast.success(successMessage);
        }

        // Reset copied state after timeout
        setTimeout(() => {
          setCopied(false);
        }, timeout);

        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Falha ao copiar');
        setError(error);
        setCopied(false);
        onError?.(error);
        
        if (showToast) {
          toast.error(errorMessage);
        }

        return false;
      }
    },
    [timeout, onSuccess, onError, showToast, successMessage, errorMessage]
  );

  const paste = useCallback(async (): Promise<string | null> => {
    if (!navigator?.clipboard) {
      const err = new Error('Clipboard API não disponível');
      setError(err);
      onError?.(err);
      return null;
    }

    try {
      const text = await navigator.clipboard.readText();
      setError(null);
      return text;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Falha ao colar');
      setError(error);
      onError?.(error);
      return null;
    }
  }, [onError]);

  const reset = useCallback(() => {
    setCopied(false);
    setError(null);
  }, []);

  return {
    copy,
    paste,
    copied,
    error,
    reset,
  };
}

/**
 * Simple copy function without hook state
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!navigator?.clipboard) {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      return result;
    } catch {
      return false;
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Hook for copying with formatting
 */
export function useFormattedClipboard() {
  const { copy, copied, error, reset } = useClipboard({ showToast: false });

  const copyAsPlainText = useCallback(
    async (text: string) => {
      return copy(text);
    },
    [copy]
  );

  const copyAsJSON = useCallback(
    async (data: unknown) => {
      try {
        const json = JSON.stringify(data, null, 2);
        return copy(json);
      } catch {
        return false;
      }
    },
    [copy]
  );

  const copyAsCSV = useCallback(
    async (data: Record<string, unknown>[]) => {
      try {
        if (data.length === 0) return false;
        
        const headers = Object.keys(data[0]);
        const csvRows = [
          headers.join(','),
          ...data.map((row) =>
            headers.map((header) => {
              const value = row[header];
              if (typeof value === 'string' && value.includes(',')) {
                return `"${value}"`;
              }
              return String(value ?? '');
            }).join(',')
          ),
        ];
        
        return copy(csvRows.join('\n'));
      } catch {
        return false;
      }
    },
    [copy]
  );

  const copyAsMarkdown = useCallback(
    async (text: string, format?: 'code' | 'link' | 'bold' | 'italic') => {
      let formatted = text;
      
      switch (format) {
        case 'code':
          formatted = `\`${text}\``;
          break;
        case 'link':
          formatted = `[${text}](${text})`;
          break;
        case 'bold':
          formatted = `**${text}**`;
          break;
        case 'italic':
          formatted = `*${text}*`;
          break;
      }
      
      return copy(formatted);
    },
    [copy]
  );

  return {
    copyAsPlainText,
    copyAsJSON,
    copyAsCSV,
    copyAsMarkdown,
    copied,
    error,
    reset,
  };
}

export default useClipboard;
