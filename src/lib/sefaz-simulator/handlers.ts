import { logger } from '@/lib/logger';
import { SEFAZ_STATUS, type SefazRequest, type SefazResponse } from './types';
import { delay, gerarChaveAcesso, gerarProtocolo, gerarRecibo } from './utils';
import { validarNFE } from './validacao';
import { gerarXMLAutorizado } from './xml';

async function processarAutorizacao(request: SefazRequest): Promise<SefazResponse> {
  if (!request.nfeData) {
    return {
      success: false,
      cStat: '225',
      xMotivo: 'Dados da NF-e não informados',
      errors: ['Dados da NF-e são obrigatórios para autorização'],
    };
  }

  const validacao = validarNFE(request.nfeData);
  if (!validacao.valid) {
    logger.debug('[SEFAZ Simulator] Validação falhou:', validacao.errors);
    return {
      success: false,
      cStat: validacao.cStat || '225',
      xMotivo:
        SEFAZ_STATUS[validacao.cStat as keyof typeof SEFAZ_STATUS] || validacao.errors[0],
      errors: validacao.errors,
    };
  }

  if (Math.random() < 0.05) {
    const rejections = ['204', '539', '593'];
    const randomReject = rejections[Math.floor(Math.random() * rejections.length)];
    logger.debug('[SEFAZ Simulator] Rejeição aleatória:', randomReject);
    return {
      success: false,
      cStat: randomReject,
      xMotivo: SEFAZ_STATUS[randomReject as keyof typeof SEFAZ_STATUS],
      errors: [SEFAZ_STATUS[randomReject as keyof typeof SEFAZ_STATUS]],
    };
  }

  const chaveAcesso = gerarChaveAcesso(request.nfeData);
  const protocolo = gerarProtocolo(request.nfeData.emitente.uf);
  const recibo = gerarRecibo(request.nfeData.emitente.uf);
  const dataRecebimento = new Date().toISOString();
  const xmlAutorizado = gerarXMLAutorizado(request.nfeData, chaveAcesso, protocolo);

  logger.debug('[SEFAZ Simulator] NFe autorizada:', { chaveAcesso, protocolo });

  return {
    success: true,
    cStat: '100',
    xMotivo: SEFAZ_STATUS['100'],
    chaveAcesso,
    protocolo,
    dataRecebimento,
    numeroRecibo: recibo,
    xml: xmlAutorizado,
  };
}

async function processarConsulta(request: SefazRequest): Promise<SefazResponse> {
  if (!request.chaveAcesso) {
    return { success: false, cStat: '593', xMotivo: 'Chave de acesso não informada' };
  }
  await delay(500 + Math.random() * 1000);
  return {
    success: true,
    cStat: '100',
    xMotivo: 'Autorizado o uso da NF-e',
    chaveAcesso: request.chaveAcesso,
    protocolo: gerarProtocolo('SP'),
    dataRecebimento: new Date().toISOString(),
  };
}

async function processarCancelamento(request: SefazRequest): Promise<SefazResponse> {
  if (!request.chaveAcesso) {
    return { success: false, cStat: '593', xMotivo: 'Chave de acesso não informada' };
  }
  if (!request.justificativa || request.justificativa.length < 15) {
    return {
      success: false,
      cStat: '999',
      xMotivo: 'Justificativa deve ter no mínimo 15 caracteres',
      errors: ['Justificativa insuficiente'],
    };
  }
  await delay(1000 + Math.random() * 1500);
  return {
    success: true,
    cStat: '101',
    xMotivo: SEFAZ_STATUS['101'],
    chaveAcesso: request.chaveAcesso,
    protocolo: gerarProtocolo('SP'),
    dataRecebimento: new Date().toISOString(),
  };
}

async function processarInutilizacao(_request: SefazRequest): Promise<SefazResponse> {
  await delay(800 + Math.random() * 1200);
  return {
    success: true,
    cStat: '102',
    xMotivo: SEFAZ_STATUS['102'],
    protocolo: gerarProtocolo('SP'),
    dataRecebimento: new Date().toISOString(),
  };
}

export async function processarSefaz(request: SefazRequest): Promise<SefazResponse> {
  logger.debug('[SEFAZ Simulator] Processando requisição:', request.tipo);
  await delay(1000 + Math.random() * 2000);

  switch (request.tipo) {
    case 'autorizacao':
      return processarAutorizacao(request);
    case 'consulta':
      return processarConsulta(request);
    case 'cancelamento':
      return processarCancelamento(request);
    case 'inutilizacao':
      return processarInutilizacao(request);
    default:
      return { success: false, cStat: '999', xMotivo: 'Tipo de requisição não suportado' };
  }
}
