import {
  Search,
  FileCode,
  Clock,
  Server,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  Activity,
} from 'lucide-react';
import { EventoTipo } from '@/lib/sefaz-event-logger';

export const formatDateTime = (date: Date) => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
};

export const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
};

// Ícone por tipo de evento
export const getEventIcon = (tipo: EventoTipo) => {
  switch (tipo) {
    case 'AUTORIZACAO':
      return CheckCircle2;
    case 'REJEICAO':
      return XCircle;
    case 'CANCELAMENTO':
      return XCircle;
    case 'CONSULTA':
      return Search;
    case 'ENVIO_LOTE':
      return Wifi;
    case 'RETORNO_LOTE':
      return Server;
    case 'ERRO_CONEXAO':
      return WifiOff;
    case 'TIMEOUT':
      return Clock;
    case 'VALIDACAO':
      return FileCode;
    case 'CONTINGENCIA':
      return AlertCircle;
    case 'INUTILIZACAO':
      return XCircle;
    default:
      return Activity;
  }
};
