// Sistema de logging de eventos SEFAZ

import { logger } from '@/lib/logger';
export type EventoTipo =
  | 'ENVIO_LOTE'
  | 'RETORNO_LOTE'
  | 'AUTORIZACAO'
  | 'REJEICAO'
  | 'CONSULTA'
  | 'CANCELAMENTO'
  | 'INUTILIZACAO'
  | 'CONTINGENCIA'
  | 'ERRO_CONEXAO'
  | 'TIMEOUT'
  | 'VALIDACAO';

export interface EventoSefaz {
  id: string;
  timestamp: Date;
  tipo: EventoTipo;
  chaveAcesso?: string;
  numeroNfe?: string;
  cStat: string;
  xMotivo: string;
  protocolo?: string;
  ambiente: 'producao' | 'homologacao';
  tempoResposta?: number;
  xmlEnviado?: string;
  xmlRetorno?: string;
  ip?: string;
  detalhes?: string;
}

// Armazena eventos em memória (em produção seria um banco de dados)
const eventosLog: EventoSefaz[] = [];

// Gera ID único para evento
function gerarEventoId(): string {
  return `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Adiciona evento ao log
export function registrarEvento(evento: Omit<EventoSefaz, 'id' | 'timestamp'>): EventoSefaz {
  const novoEvento: EventoSefaz = {
    ...evento,
    id: gerarEventoId(),
    timestamp: new Date(),
  };

  eventosLog.unshift(novoEvento); // Adiciona no início (mais recente primeiro)

  // Limita a 1000 eventos em memória
  if (eventosLog.length > 1000) {
    eventosLog.pop();
  }

  logger.debug('[SEFAZ Event Logger]', novoEvento);
  return novoEvento;
}

// Retorna todos os eventos
export function getEventos(): EventoSefaz[] {
  return [...eventosLog];
}

// Retorna eventos por chave de acesso
export function getEventosPorChave(chaveAcesso: string): EventoSefaz[] {
  return eventosLog.filter((e) => e.chaveAcesso === chaveAcesso);
}

// Retorna eventos por número da NF-e
export function getEventosPorNumero(numeroNfe: string): EventoSefaz[] {
  return eventosLog.filter((e) => e.numeroNfe === numeroNfe);
}

// Retorna eventos por tipo
export function getEventosPorTipo(tipo: EventoTipo): EventoSefaz[] {
  return eventosLog.filter((e) => e.tipo === tipo);
}

// Retorna eventos por período
export function getEventosPorPeriodo(inicio: Date, fim: Date): EventoSefaz[] {
  return eventosLog.filter((e) => e.timestamp >= inicio && e.timestamp <= fim);
}

// Limpa eventos antigos (mais de X dias)
export function limparEventosAntigos(dias: number = 30): number {
  const limite = new Date();
  limite.setDate(limite.getDate() - dias);

  const antes = eventosLog.length;
  const indice = eventosLog.findIndex((e) => e.timestamp < limite);

  if (indice !== -1) {
    eventosLog.splice(indice);
  }

  return antes - eventosLog.length;
}

// Estatísticas dos eventos
export function getEstatisticas() {
  const total = eventosLog.length;
  const autorizadas = eventosLog.filter((e) => e.tipo === 'AUTORIZACAO').length;
  const rejeitadas = eventosLog.filter((e) => e.tipo === 'REJEICAO').length;
  const erros = eventosLog.filter((e) => e.tipo === 'ERRO_CONEXAO' || e.tipo === 'TIMEOUT').length;

  const temposResposta = eventosLog
    .filter((e) => e.tempoResposta !== undefined)
    .map((e) => e.tempoResposta!);

  const tempoMedio =
    temposResposta.length > 0
      ? temposResposta.reduce((a, b) => a + b, 0) / temposResposta.length
      : 0;

  return {
    total,
    autorizadas,
    rejeitadas,
    erros,
    taxaSucesso: total > 0 ? ((autorizadas / total) * 100).toFixed(1) : '0',
    tempoMedioResposta: tempoMedio.toFixed(0),
    // Quantos eventos têm tempo de resposta medido. Eventos administrativos
    // (ativar/desativar contingência) entram no log sem `tempoResposta`, então
    // `total > 0` não garante que exista média: sem este contador a tela
    // exibia "0ms" de resposta da SEFAZ (achado do Devin na PR #423).
    temposMedidos: temposResposta.length,
  };
}

// Cores por tipo de evento
export const eventTypeConfig: Record<
  EventoTipo,
  { label: string; color: string; bgColor: string }
> = {
  ENVIO_LOTE: { label: 'Envio de Lote', color: 'text-primary', bgColor: 'bg-primary/10' },
  RETORNO_LOTE: { label: 'Retorno de Lote', color: 'text-primary', bgColor: 'bg-primary/10' },
  AUTORIZACAO: { label: 'Autorização', color: 'text-success', bgColor: 'bg-success/10' },
  REJEICAO: { label: 'Rejeição', color: 'text-destructive', bgColor: 'bg-destructive/10' },
  CONSULTA: { label: 'Consulta', color: 'text-accent-foreground', bgColor: 'bg-accent/10' },
  CANCELAMENTO: { label: 'Cancelamento', color: 'text-warning', bgColor: 'bg-warning/10' },
  INUTILIZACAO: { label: 'Inutilização', color: 'text-muted-foreground', bgColor: 'bg-muted/50' },
  CONTINGENCIA: { label: 'Contingência', color: 'text-warning', bgColor: 'bg-warning/10' },
  ERRO_CONEXAO: {
    label: 'Erro de Conexão',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
  TIMEOUT: { label: 'Timeout', color: 'text-destructive', bgColor: 'bg-destructive/10' },
  VALIDACAO: { label: 'Validação', color: 'text-primary', bgColor: 'bg-primary/10' },
};
