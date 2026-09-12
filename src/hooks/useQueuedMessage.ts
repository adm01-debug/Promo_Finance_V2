import { useCallback, useEffect, useRef, useState } from 'react';

export function useQueuedMessage(
  isLoading: boolean,
  enviarMensagem: (mensagem: string) => Promise<void>
) {
  const [mensagensPendentes, setMensagensPendentes] = useState<string[]>([]);
  const [cicloDeEnvio, setCicloDeEnvio] = useState(0);
  const envioEmAndamento = useRef(false);
  const enviarMensagemRef = useRef(enviarMensagem);
  enviarMensagemRef.current = enviarMensagem;

  useEffect(() => {
    if (isLoading || envioEmAndamento.current || mensagensPendentes.length === 0) return;

    const [proximaMensagem] = mensagensPendentes;
    envioEmAndamento.current = true;
    setMensagensPendentes((fila) => fila.slice(1));

    void Promise.resolve(enviarMensagemRef.current(proximaMensagem))
      .catch(() => undefined)
      .finally(() => {
        envioEmAndamento.current = false;
        setCicloDeEnvio((ciclo) => ciclo + 1);
      });
  }, [cicloDeEnvio, isLoading, mensagensPendentes]);

  return useCallback((mensagem: string) => {
    setMensagensPendentes((fila) => [...fila, mensagem]);
  }, []);
}
