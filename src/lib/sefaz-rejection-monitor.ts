// Sistema de monitoramento de rejeições consecutivas da SEFAZ

import { getEventos, EventoSefaz } from './sefaz-event-logger';

export interface AlertaRejeicao {
  id: string;
  tipo: 'aviso' | 'critico';
  titulo: string;
  mensagem: string;
  rejeicoesConsecutivas: number;
  ultimasRejeicoes: EventoSefaz[];
  dataDetectado: Date;
  lido: boolean;
  acaoRecomendada: string;
}

// Armazena alertas em memória
let alertasRejeicao: AlertaRejeicao[] = [];

// Listeners para novos alertas
type AlertaListener = (alerta: AlertaRejeicao) => void;
const listeners: AlertaListener[] = [];

export function adicionarListenerAlerta(listener: AlertaListener): () => void {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) listeners.splice(index, 1);
  };
}

function notificarListeners(alerta: AlertaRejeicao) {
  listeners.forEach(listener => listener(alerta));
}

// Verifica rejeições consecutivas nos eventos
export function verificarRejeicoesConsecutivas(limiteAviso = 3, limiteCritico = 5): AlertaRejeicao | null {
  const eventos = getEventos();
  
  // Pega apenas os eventos mais recentes (últimas 2 horas)
  const duasHorasAtras = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const eventosRecentes = eventos.filter(e => e.timestamp >= duasHorasAtras);
  
  // Conta rejeições consecutivas no início (eventos mais recentes)
  let rejeicoesConsecutivas = 0;
  const ultimasRejeicoes: EventoSefaz[] = [];
  
  for (const evento of eventosRecentes) {
    if (evento.tipo === 'REJEICAO') {
      rejeicoesConsecutivas++;
      ultimasRejeicoes.push(evento);
    } else if (evento.tipo === 'AUTORIZACAO') {
      break; // Para de contar quando encontra uma autorização
    }
  }
  
  if (rejeicoesConsecutivas >= limiteAviso) {
    const isCritico = rejeicoesConsecutivas >= limiteCritico;
    
    const alerta: AlertaRejeicao = {
      id: `ALERTA-REJ-${Date.now()}`,
      tipo: isCritico ? 'critico' : 'aviso',
      titulo: isCritico 
        ? `Alerta Crítico: ${rejeicoesConsecutivas} Rejeições Consecutivas`
        : `Atenção: ${rejeicoesConsecutivas} Rejeições Consecutivas`,
      mensagem: isCritico
        ? 'O sistema detectou múltiplas rejeições consecutivas da SEFAZ. Verifique imediatamente a configuração do certificado digital e os dados das notas fiscais.'
        : 'Foram detectadas rejeições consecutivas. Recomenda-se verificar os dados das notas fiscais antes de continuar.',
      rejeicoesConsecutivas,
      ultimasRejeicoes: ultimasRejeicoes.slice(0, 5),
      dataDetectado: new Date(),
      lido: false,
      acaoRecomendada: isCritico
        ? 'Pausar emissão de NF-e e verificar certificado digital, configurações de ambiente e dados cadastrais.'
        : 'Revisar os dados das últimas notas rejeitadas e corrigir os erros antes de reenviar.'
    };
    
    return alerta;
  }
  
  return null;
}

// Registra um novo alerta
export function registrarAlerta(alerta: AlertaRejeicao): void {
  // Evita duplicatas (mesmo número de rejeições em menos de 5 minutos)
  const alertaRecente = alertasRejeicao.find(
    a => a.rejeicoesConsecutivas === alerta.rejeicoesConsecutivas &&
         (new Date().getTime() - a.dataDetectado.getTime()) < 5 * 60 * 1000
  );
  
  if (!alertaRecente) {
    alertasRejeicao.unshift(alerta);
    notificarListeners(alerta);
    
    // Mantém apenas os últimos 50 alertas
    if (alertasRejeicao.length > 50) {
      alertasRejeicao.pop();
    }
  }
}

// Retorna todos os alertas
export function getAlertas(): AlertaRejeicao[] {
  return [...alertasRejeicao];
}

// Retorna alertas não lidos
export function getAlertasNaoLidos(): AlertaRejeicao[] {
  return alertasRejeicao.filter(a => !a.lido);
}

// Marca alerta como lido
export function marcarAlertaComoLido(id: string): void {
  const alerta = alertasRejeicao.find(a => a.id === id);
  if (alerta) {
    alerta.lido = true;
  }
}

// Marca todos como lidos
export function marcarTodosComoLidos(): void {
  alertasRejeicao.forEach(a => a.lido = true);
}

// Remove um alerta
export function removerAlerta(id: string): void {
  alertasRejeicao = alertasRejeicao.filter(a => a.id !== id);
}

// Limpa todos os alertas
export function limparAlertas(): void {
  alertasRejeicao = [];
}

// Análise de padrões de rejeição
export function analisarPadroesRejeicao(): {
  codigosFrequentes: { codigo: string; motivo: string; count: number }[];
  horariosPico: { hora: number; count: number }[];
  tendencia: 'estavel' | 'aumentando' | 'diminuindo';
} {
  const eventos = getEventos();
  const rejeicoes = eventos.filter(e => e.tipo === 'REJEICAO');
  
  // Agrupa por código de status
  const codigosMap = new Map<string, { motivo: string; count: number }>();
  rejeicoes.forEach(r => {
    const existing = codigosMap.get(r.cStat);
    if (existing) {
      existing.count++;
    } else {
      codigosMap.set(r.cStat, { motivo: r.xMotivo, count: 1 });
    }
  });
  
  const codigosFrequentes = Array.from(codigosMap.entries())
    .map(([codigo, data]) => ({ codigo, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // Agrupa por hora
  const horasMap = new Map<number, number>();
  rejeicoes.forEach(r => {
    const hora = r.timestamp.getHours();
    horasMap.set(hora, (horasMap.get(hora) || 0) + 1);
  });
  
  const horariosPico = Array.from(horasMap.entries())
    .map(([hora, count]) => ({ hora, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  
  // Calcula tendência (compara última hora com hora anterior)
  const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000);
  const duasHorasAtras = new Date(Date.now() - 2 * 60 * 60 * 1000);
  
  const rejeicoesUltimaHora = rejeicoes.filter(r => r.timestamp >= umaHoraAtras).length;
  const rejeicoesHoraAnterior = rejeicoes.filter(
    r => r.timestamp >= duasHorasAtras && r.timestamp < umaHoraAtras
  ).length;
  
  let tendencia: 'estavel' | 'aumentando' | 'diminuindo' = 'estavel';
  if (rejeicoesUltimaHora > rejeicoesHoraAnterior * 1.5) {
    tendencia = 'aumentando';
  } else if (rejeicoesUltimaHora < rejeicoesHoraAnterior * 0.5) {
    tendencia = 'diminuindo';
  }
  
  return { codigosFrequentes, horariosPico, tendencia };
}

// Inicializa com alguns alertas de demo
export function inicializarAlertasDemo(): void {
  const alertaDemo: AlertaRejeicao = {
    id: 'ALERTA-DEMO-1',
    tipo: 'aviso',
    titulo: 'Atenção: 3 Rejeições Consecutivas',
    mensagem: 'Foram detectadas rejeições consecutivas. Recomenda-se verificar os dados das notas fiscais antes de continuar.',
    rejeicoesConsecutivas: 3,
    ultimasRejeicoes: [],
    dataDetectado: new Date(Date.now() - 30 * 60 * 1000),
    lido: false,
    acaoRecomendada: 'Revisar os dados das últimas notas rejeitadas e corrigir os erros antes de reenviar.'
  };
  
  alertasRejeicao.push(alertaDemo);
}

// Inicializa demo
inicializarAlertasDemo();
