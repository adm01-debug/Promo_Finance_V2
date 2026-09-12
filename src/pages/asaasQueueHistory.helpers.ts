import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatarTimestampFila(timestamp: unknown): string {
  if (typeof timestamp !== 'string') return 'Data indisponível';

  const data = parseISO(timestamp);
  return isValid(data) ? format(data, 'dd/MM HH:mm', { locale: ptBR }) : 'Data indisponível';
}
