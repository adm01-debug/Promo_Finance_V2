// CATÁLOGOS FISCAIS — Alertas proativos de divergência para o dashboard.
//
// Módulo puro (sem I/O, sem React): recebe os registros já lidos do banco e
// devolve uma lista normalizada de alertas, cada um apontando explicitamente
// o CATÁLOGO, o ITEM e o CAMPO divergente, além dos valores em conflito.
//
// A intenção é que o dashboard possa sinalizar drift de catálogo sem que o
// usuário precise abrir o painel administrativo.

import { compararFaixasComCatalogo } from './coerencia';
import { compararItensIssComCatalogo, type ItemIssBanco } from './coerencia-iss';
import { compararMvaComCatalogo, type EntradaCoerenciaMva } from './coerencia-mva';
import { compararNcmsComCatalogo, type NcmBanco } from './coerencia-ncm';
import { compararUfsComCatalogo, validarMarcadorFcp } from './coerencia-ufs';
import { validarInterestaduais } from './painel';
import type {
  AliquotaInterestadualCatalogo,
  FaixaSimplesCatalogo,
  UfCatalogo,
} from './types';

/** Identificador estável do catálogo de origem do alerta. */
export type CatalogoId =
  | 'ufs'
  | 'interestaduais'
  | 'faixas_simples'
  | 'itens_iss'
  | 'ncms'
  | 'protocolos_st';

/**
 * Gravidade do alerta:
 * - `critico`: o motor pode calcular com base divergente ou sem lastro;
 * - `atencao`: inconsistência relevante, porém sem impacto direto no cálculo.
 */
export type SeveridadeAlerta = 'critico' | 'atencao';

export interface AlertaCatalogo {
  /** Chave estável para renderização e deduplicação. */
  id: string;
  catalogo: CatalogoId;
  /** Rótulo legível do catálogo. */
  catalogoTitulo: string;
  severidade: SeveridadeAlerta;
  /** Item divergente (UF, par de UFs, faixa, item da LC 116 ou NCM). */
  item: string;
  /** Campo divergente dentro do item. */
  campo: string;
  /** Valor conhecido pelo motor/pela regra legal (null quando inaplicável). */
  valorMotor: string | number | boolean | null;
  /** Valor encontrado no banco (null quando ausente). */
  valorBanco: string | number | boolean | null;
  /** Descrição pronta para leitura humana. */
  mensagem: string;
}

export interface ResumoAlertasCatalogos {
  alertas: AlertaCatalogo[];
  total: number;
  criticos: number;
  atencoes: number;
  /** Catálogos distintos com ao menos um alerta. */
  catalogosAfetados: CatalogoId[];
}

export const TITULOS_CATALOGO: Record<CatalogoId, string> = {
  ufs: 'Unidades Federativas (ICMS/FCP)',
  interestaduais: 'Alíquotas interestaduais',
  faixas_simples: 'Faixas do Simples Nacional',
  itens_iss: 'Itens da LC 116/2003 (ISS)',
  ncms: 'NCMs (TIPI, monofásico e ST)',
  protocolos_st: 'Protocolos de ST (MVA)',
};

/** Campos cuja divergência altera diretamente o valor calculado do tributo. */
const CAMPOS_CRITICOS = new Set([
  'ausente',
  'duplicado',
  'codigo_invalido',
  'aliquota',
  'aliquota_interna',
  'aliquota_ipi',
  'monofasico',
  'retencao',
  'rbt12_de',
  'rbt12_ate',
  'parcela_deduzir',
  'catalogo_vazio',
  'sem_protocolo',
  'mva_invalida',
  'mva_divergente',
  'protocolo_sem_ufs',
  'ncm_desconhecido',
  'uf_invalida',
  'vinculo_duplicado',
]);

function severidade(campo: string): SeveridadeAlerta {
  return CAMPOS_CRITICOS.has(campo) ? 'critico' : 'atencao';
}

function formatar(valor: string | number | boolean | null): string {
  if (valor === null || valor === undefined) return '—';
  if (typeof valor === 'boolean') return valor ? 'sim' : 'não';
  return String(valor);
}

function montar(
  catalogo: CatalogoId,
  item: string,
  campo: string,
  valorMotor: string | number | boolean | null,
  valorBanco: string | number | boolean | null,
  mensagem?: string,
): AlertaCatalogo {
  return {
    id: `${catalogo}:${item}:${campo}`,
    catalogo,
    catalogoTitulo: TITULOS_CATALOGO[catalogo],
    severidade: severidade(campo),
    item,
    campo,
    valorMotor,
    valorBanco,
    mensagem:
      mensagem ??
      `${item} — ${campo}: motor ${formatar(valorMotor)} ≠ banco ${formatar(valorBanco)}`,
  };
}

/**
 * Converte mensagens textuais no formato `"<item>: <descrição>"` em alertas
 * estruturados. Usado pelas validações internas que já produzem texto
 * (marcador de FCP e cobertura interestadual).
 */
function deTexto(catalogo: CatalogoId, campo: string, mensagens: readonly string[]): AlertaCatalogo[] {
  return mensagens.map((msg, indice) => {
    const separador = msg.indexOf(':');
    const temItem = separador > 0;
    const item = temItem ? msg.slice(0, separador).trim() : `#${indice + 1}`;
    return {
      id: `${catalogo}:${item}:${campo}:${indice}`,
      catalogo,
      catalogoTitulo: TITULOS_CATALOGO[catalogo],
      severidade: severidade(campo),
      item,
      campo,
      valorMotor: null,
      valorBanco: null,
      mensagem: msg,
    };
  });
}

export interface EntradaAlertasCatalogos {
  ufs: readonly UfCatalogo[];
  interestaduais: readonly AliquotaInterestadualCatalogo[];
  faixas: readonly FaixaSimplesCatalogo[];
  itensIss?: readonly ItemIssBanco[];
  ncms?: readonly NcmBanco[];
  /** Vínculos e UFs signatárias dos protocolos de ST (overlay de MVA). */
  mvaSt?: EntradaCoerenciaMva;
}

/**
 * Gera os alertas proativos de divergência de catálogo.
 *
 * Cobre, para cada catálogo: ausência total de registros (o motor perderia o
 * lastro versionado) e cada divergência campo a campo detectada pelas guardas
 * de coerência já existentes.
 */
export function gerarAlertasCatalogos(
  entrada: EntradaAlertasCatalogos,
): ResumoAlertasCatalogos {
  const { ufs, interestaduais, faixas, itensIss, ncms } = entrada;
  const alertas: AlertaCatalogo[] = [];

  const vazio = (catalogo: CatalogoId, registros: number): boolean => {
    if (registros > 0) return false;
    alertas.push(
      montar(
        catalogo,
        TITULOS_CATALOGO[catalogo],
        'catalogo_vazio',
        null,
        0,
        `${TITULOS_CATALOGO[catalogo]}: catálogo sem registros no banco — o motor opera apenas com as tabelas embarcadas`,
      ),
    );
    return true;
  };

  // --- UFs -----------------------------------------------------------------
  if (!vazio('ufs', ufs.length)) {
    for (const d of compararUfsComCatalogo(ufs)) {
      alertas.push(
        montar(
          'ufs',
          d.uf,
          d.campo,
          d.valorCodigo,
          d.valorBanco,
          d.campo === 'ausente'
            ? `${d.uf} — ausente: UF conhecida pelo motor não existe no catálogo do banco`
            : d.campo === 'excedente'
              ? `${d.uf} — excedente: UF presente no banco e desconhecida pelo motor`
              : undefined,
        ),
      );
    }
    alertas.push(...deTexto('ufs', 'possui_fcp', validarMarcadorFcp(ufs)));
  }

  // --- Alíquotas interestaduais -------------------------------------------
  if (!vazio('interestaduais', interestaduais.length)) {
    alertas.push(
      ...deTexto('interestaduais', 'aliquota', validarInterestaduais(ufs, interestaduais)),
    );
  }

  // --- Faixas do Simples Nacional -----------------------------------------
  if (!vazio('faixas_simples', faixas.length)) {
    for (const d of compararFaixasComCatalogo(faixas)) {
      const item = `Anexo ${d.anexo} · faixa ${d.faixa}`;
      alertas.push(
        montar(
          'faixas_simples',
          item,
          d.campo,
          d.valorCodigo,
          d.valorBanco,
          d.campo === 'ausente'
            ? `${item} — ausente: faixa do motor não existe no catálogo do banco`
            : undefined,
        ),
      );
    }
  }

  // --- Itens da LC 116 -----------------------------------------------------
  if (itensIss && !vazio('itens_iss', itensIss.length)) {
    for (const d of compararItensIssComCatalogo(itensIss)) {
      alertas.push(montar('itens_iss', `Item ${d.item}`, d.campo, d.valorCodigo, d.valorBanco));
    }
  }

  // --- NCMs ----------------------------------------------------------------
  if (ncms && !vazio('ncms', ncms.length)) {
    for (const d of compararNcmsComCatalogo(ncms)) {
      alertas.push(montar('ncms', `NCM ${d.ncm}`, d.campo, d.valorCodigo, d.valorBanco));
    }
  }

  // --- Protocolos de ST (MVA) ---------------------------------------------
  if (entrada.mvaSt && !vazio('protocolos_st', entrada.mvaSt.vinculos.length)) {
    for (const d of compararMvaComCatalogo({ ...entrada.mvaSt, ncms: entrada.mvaSt.ncms ?? ncms })) {
      alertas.push(
        montar(
          'protocolos_st',
          d.item,
          d.campo,
          d.valorCodigo,
          d.valorBanco,
          d.campo === 'sem_protocolo'
            ? `${d.item} — sem_protocolo: NCM marcado como sujeito à ST sem vínculo de protocolo vigente`
            : d.campo === 'cobertura_parcial'
              ? `${d.item} — cobertura_parcial: ${d.valorBanco} de ${d.valorCodigo} UFs signatárias cadastradas`
              : undefined,
        ),
      );
    }
  }

  // Críticos primeiro, mantendo a ordem estável dentro de cada gravidade.
  const ordenados = [...alertas].sort((a, b) => {
    if (a.severidade === b.severidade) return 0;
    return a.severidade === 'critico' ? -1 : 1;
  });

  return {
    alertas: ordenados,
    total: ordenados.length,
    criticos: ordenados.filter((a) => a.severidade === 'critico').length,
    atencoes: ordenados.filter((a) => a.severidade === 'atencao').length,
    catalogosAfetados: [...new Set(ordenados.map((a) => a.catalogo))],
  };
}
