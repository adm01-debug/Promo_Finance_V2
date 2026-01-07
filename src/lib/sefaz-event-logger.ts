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
    timestamp: new Date()
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
  return eventosLog.filter(e => e.chaveAcesso === chaveAcesso);
}

// Retorna eventos por número da NF-e
export function getEventosPorNumero(numeroNfe: string): EventoSefaz[] {
  return eventosLog.filter(e => e.numeroNfe === numeroNfe);
}

// Retorna eventos por tipo
export function getEventosPorTipo(tipo: EventoTipo): EventoSefaz[] {
  return eventosLog.filter(e => e.tipo === tipo);
}

// Retorna eventos por período
export function getEventosPorPeriodo(inicio: Date, fim: Date): EventoSefaz[] {
  return eventosLog.filter(e => 
    e.timestamp >= inicio && e.timestamp <= fim
  );
}

// Limpa eventos antigos (mais de X dias)
export function limparEventosAntigos(dias: number = 30): number {
  const limite = new Date();
  limite.setDate(limite.getDate() - dias);
  
  const antes = eventosLog.length;
  const indice = eventosLog.findIndex(e => e.timestamp < limite);
  
  if (indice !== -1) {
    eventosLog.splice(indice);
  }
  
  return antes - eventosLog.length;
}

// Estatísticas dos eventos
export function getEstatisticas() {
  const total = eventosLog.length;
  const autorizadas = eventosLog.filter(e => e.tipo === 'AUTORIZACAO').length;
  const rejeitadas = eventosLog.filter(e => e.tipo === 'REJEICAO').length;
  const erros = eventosLog.filter(e => e.tipo === 'ERRO_CONEXAO' || e.tipo === 'TIMEOUT').length;
  
  const temposResposta = eventosLog
    .filter(e => e.tempoResposta !== undefined)
    .map(e => e.tempoResposta!);
  
  const tempoMedio = temposResposta.length > 0 
    ? temposResposta.reduce((a, b) => a + b, 0) / temposResposta.length 
    : 0;

  return {
    total,
    autorizadas,
    rejeitadas,
    erros,
    taxaSucesso: total > 0 ? ((autorizadas / total) * 100).toFixed(1) : '0',
    tempoMedioResposta: tempoMedio.toFixed(0)
  };
}

// Cores por tipo de evento
export const eventTypeConfig: Record<EventoTipo, { label: string; color: string; bgColor: string }> = {
  'ENVIO_LOTE': { label: 'Envio de Lote', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  'RETORNO_LOTE': { label: 'Retorno de Lote', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  'AUTORIZACAO': { label: 'Autorização', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  'REJEICAO': { label: 'Rejeição', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  'CONSULTA': { label: 'Consulta', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  'CANCELAMENTO': { label: 'Cancelamento', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  'INUTILIZACAO': { label: 'Inutilização', color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
  'CONTINGENCIA': { label: 'Contingência', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  'ERRO_CONEXAO': { label: 'Erro de Conexão', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  'TIMEOUT': { label: 'Timeout', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  'VALIDACAO': { label: 'Validação', color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' }
};

// Inicializa com alguns eventos de exemplo
export function inicializarEventosDemo() {
  const eventosDemo: Omit<EventoSefaz, 'id' | 'timestamp'>[] = [
    {
      tipo: 'AUTORIZACAO',
      chaveAcesso: '35240112345678000190550010000012341234567890',
      numeroNfe: '000001234',
      cStat: '100',
      xMotivo: 'Autorizado o uso da NF-e',
      protocolo: '135240000123456',
      ambiente: 'homologacao',
      tempoResposta: 2340,
      detalhes: 'NF-e autorizada com sucesso após validação completa'
    },
    {
      tipo: 'ENVIO_LOTE',
      chaveAcesso: '35240112345678000190550010000012341234567890',
      numeroNfe: '000001234',
      cStat: '103',
      xMotivo: 'Lote recebido com sucesso',
      ambiente: 'homologacao',
      tempoResposta: 1200,
      detalhes: 'Lote enviado para processamento'
    },
    {
      tipo: 'VALIDACAO',
      numeroNfe: '000001234',
      cStat: '000',
      xMotivo: 'Validação de schema XML concluída',
      ambiente: 'homologacao',
      tempoResposta: 150,
      detalhes: 'Estrutura XML validada conforme schema NF-e 4.00'
    },
    {
      tipo: 'AUTORIZACAO',
      chaveAcesso: '35240112345678000190550010000012351234567891',
      numeroNfe: '000001235',
      cStat: '100',
      xMotivo: 'Autorizado o uso da NF-e',
      protocolo: '135240000123457',
      ambiente: 'homologacao',
      tempoResposta: 1890,
      detalhes: 'NF-e autorizada'
    },
    {
      tipo: 'CANCELAMENTO',
      chaveAcesso: '35240112345678000190550010000012361234567892',
      numeroNfe: '000001236',
      cStat: '101',
      xMotivo: 'Cancelamento de NF-e homologado',
      protocolo: '135240000123460',
      ambiente: 'homologacao',
      tempoResposta: 2100,
      detalhes: 'Cancelamento solicitado pelo emitente'
    },
    {
      tipo: 'REJEICAO',
      numeroNfe: '000001240',
      cStat: '204',
      xMotivo: 'Duplicidade de NF-e',
      ambiente: 'homologacao',
      tempoResposta: 980,
      detalhes: 'NF-e com mesma chave já existe na base da SEFAZ'
    },
    {
      tipo: 'CONSULTA',
      chaveAcesso: '35240112345678000190550010000012341234567890',
      numeroNfe: '000001234',
      cStat: '100',
      xMotivo: 'Autorizado o uso da NF-e',
      protocolo: '135240000123456',
      ambiente: 'homologacao',
      tempoResposta: 450,
      detalhes: 'Consulta de situação da NF-e'
    }
  ];

  // Adiciona eventos com timestamps diferentes
  eventosDemo.forEach((evento, index) => {
    const novoEvento: EventoSefaz = {
      ...evento,
      id: gerarEventoId(),
      timestamp: new Date(Date.now() - (index * 3600000)) // 1 hora de diferença entre cada
    };
    eventosLog.push(novoEvento);
  });
}

// Inicializa eventos de demonstração
inicializarEventosDemo();
