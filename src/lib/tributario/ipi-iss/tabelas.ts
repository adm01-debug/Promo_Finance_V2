/**
 * Tabelas embarcadas do módulo IPI/ISS.
 *
 * - TIPI: recorte da tabela aprovada pelo Decreto 11.158/2022, com os NCM de
 *   maior giro no segmento de brindes, embalagens, têxteis e eletrônicos.
 * - LC 116/2003: lista de serviços anexa, com o local de incidência do art. 3º.
 *
 * As alíquotas são valores de referência para simulação; a apuração oficial deve
 * confrontar o NCM e o item da lista com a legislação vigente na data do fato gerador.
 */

import type { ItemLc116, ItemTipi } from './types';

/** Alíquota mínima do ISS — LC 116/2003, art. 8º-A (incluído pela LC 157/2016). */
export const ISS_ALIQUOTA_MINIMA = 0.02;
/** Alíquota máxima do ISS — LC 116/2003, art. 8º, II. */
export const ISS_ALIQUOTA_MAXIMA = 0.05;

/** Retenção de PIS/COFINS/CSLL — Lei 10.833/2003, art. 30 e 31. */
export const CSRF_PIS = 0.0065;
export const CSRF_COFINS = 0.03;
export const CSRF_CSLL = 0.01;
export const CSRF_TOTAL = CSRF_PIS + CSRF_COFINS + CSRF_CSLL; // 4,65%
/**
 * Piso de retenção da CSRF: pagamentos de até R$ 215,05 resultariam em valor
 * inferior a R$ 10,00 (Lei 10.833/2003, art. 31, §3º, com a Lei 13.137/2015).
 */
export const CSRF_PISO_PAGAMENTO = 215.05;
/** Dispensa de recolhimento do IRRF igual ou inferior a R$ 10,00 — RIR/2018, art. 785. */
export const IRRF_PISO_RECOLHIMENTO = 10;
/** Retenção previdenciária por cessão de mão de obra — Lei 8.212/1991, art. 31. */
export const INSS_RETENCAO_CESSAO = 0.11;

export const TIPI: readonly ItemTipi[] = [
  { ncm: '39241000', descricao: 'Serviços de mesa e artigos de plástico para cozinha', aliquota: 0.0325, situacao: 'tributada' },
  { ncm: '39264000', descricao: 'Estatuetas e outros objetos de ornamentação, de plástico', aliquota: 0.0325, situacao: 'tributada' },
  { ncm: '39269090', descricao: 'Outras obras de plástico', aliquota: 0.0325, situacao: 'tributada' },
  { ncm: '42021200', descricao: 'Malas e mochilas com superfície exterior de plástico ou têxtil', aliquota: 0.0975, situacao: 'tributada' },
  { ncm: '48201000', descricao: 'Agendas, blocos de notas e cadernos', aliquota: 0, situacao: 'aliquota_zero' },
  { ncm: '49019900', descricao: 'Livros, brochuras e impressos semelhantes', aliquota: 0, situacao: 'imune' },
  { ncm: '61091000', descricao: 'Camisetas de malha de algodão', aliquota: 0, situacao: 'nao_tributada' },
  { ncm: '62052000', descricao: 'Camisas de algodão, de uso masculino', aliquota: 0, situacao: 'nao_tributada' },
  { ncm: '63071000', descricao: 'Rodilhas, esfregões e flanelas', aliquota: 0, situacao: 'nao_tributada' },
  { ncm: '65050090', descricao: 'Bonés e outros chapéus de matérias têxteis', aliquota: 0, situacao: 'nao_tributada' },
  { ncm: '69120000', descricao: 'Louça e artigos de cerâmica para uso doméstico', aliquota: 0.0325, situacao: 'tributada' },
  { ncm: '70133700', descricao: 'Outros copos de vidro', aliquota: 0.065, situacao: 'tributada' },
  { ncm: '73239300', descricao: 'Artigos de uso doméstico de aço inoxidável (garrafas térmicas)', aliquota: 0.0325, situacao: 'tributada' },
  { ncm: '82055900', descricao: 'Outras ferramentas manuais', aliquota: 0.0325, situacao: 'tributada' },
  { ncm: '84713012', descricao: 'Máquinas automáticas para processamento de dados, portáteis', aliquota: 0.0975, situacao: 'tributada' },
  { ncm: '85234110', descricao: 'Discos e mídias ópticas não gravadas', aliquota: 0.15, situacao: 'tributada' },
  { ncm: '85234910', descricao: 'Cartões de memória e pen drives', aliquota: 0.15, situacao: 'tributada' },
  { ncm: '85171231', descricao: 'Telefones celulares (smartphones)', aliquota: 0.0325, situacao: 'tributada' },
  { ncm: '85183000', descricao: 'Fones de ouvido e conjuntos microfone/altifalante', aliquota: 0.0975, situacao: 'tributada' },
  { ncm: '85076000', descricao: 'Acumuladores de íon de lítio (power banks)', aliquota: 0.0975, situacao: 'tributada' },
  { ncm: '91029900', descricao: 'Outros relógios de pulso', aliquota: 0.2, situacao: 'tributada' },
  { ncm: '96081000', descricao: 'Canetas esferográficas', aliquota: 0.0975, situacao: 'tributada' },
  { ncm: '96170010', descricao: 'Garrafas térmicas e outros recipientes isotérmicos', aliquota: 0.0975, situacao: 'tributada' },
  { ncm: '95030099', descricao: 'Outros brinquedos', aliquota: 0, situacao: 'aliquota_zero' },
  { ncm: '33030010', descricao: 'Perfumes', aliquota: 0.42, situacao: 'tributada' },
  { ncm: '22030000', descricao: 'Cervejas de malte', aliquota: 0, situacao: 'nao_tributada' },
] as const;

const TIPI_INDEX = new Map(TIPI.map((i) => [i.ncm, i]));

/** Normaliza o NCM removendo pontos, traços e espaços. */
export function normalizarNcm(ncm: string): string {
  return ncm.replace(/\D/g, '');
}

/** Busca o item da TIPI pelo NCM (aceita máscara). Retorna `undefined` se não catalogado. */
export function buscarTipi(ncm: string): ItemTipi | undefined {
  return TIPI_INDEX.get(normalizarNcm(ncm));
}

/**
 * Lista de serviços da LC 116/2003 — recorte operacional.
 *
 * `local` reflete o art. 3º: a regra geral é o estabelecimento prestador
 * (caput) e os incisos I a XXV são as exceções (local da execução) — os itens
 * 4.22, 4.23, 5.09, 15.09, 10.04 e 17.05 seguem o domicílio do tomador.
 */
export const LISTA_LC116: readonly ItemLc116[] = [
  { item: '1.01', descricao: 'Análise e desenvolvimento de sistemas', local: 'estabelecimento_prestador', retencaoIssPadrao: false, permiteDeducaoMateriais: false, retencaoInss11: false, irrfAliquota: 0.015 },
  { item: '1.05', descricao: 'Licenciamento ou cessão de direito de uso de programas de computação', local: 'estabelecimento_prestador', retencaoIssPadrao: false, permiteDeducaoMateriais: false, retencaoInss11: false, irrfAliquota: 0.015 },
  { item: '1.07', descricao: 'Suporte técnico em informática, inclusive instalação e configuração', local: 'estabelecimento_prestador', retencaoIssPadrao: false, permiteDeducaoMateriais: false, retencaoInss11: false, irrfAliquota: 0.015 },
  { item: '4.03', descricao: 'Hospitais, clínicas, laboratórios e pronto-socorros', local: 'estabelecimento_prestador', retencaoIssPadrao: false, permiteDeducaoMateriais: false, retencaoInss11: false, irrfAliquota: 0.015 },
  { item: '4.22', descricao: 'Planos de medicina de grupo ou individual', local: 'domicilio_tomador', retencaoIssPadrao: true, permiteDeducaoMateriais: false, retencaoInss11: false, irrfAliquota: 0 },
  { item: '5.09', descricao: 'Planos de atendimento e assistência médico-veterinária', local: 'domicilio_tomador', retencaoIssPadrao: true, permiteDeducaoMateriais: false, retencaoInss11: false, irrfAliquota: 0 },
  { item: '7.02', descricao: 'Execução de obras de construção civil, hidráulica ou elétrica', local: 'local_da_prestacao', retencaoIssPadrao: true, permiteDeducaoMateriais: true, retencaoInss11: true, irrfAliquota: 0.015 },
  { item: '7.05', descricao: 'Reparação, conservação e reforma de edifícios e estradas', local: 'local_da_prestacao', retencaoIssPadrao: true, permiteDeducaoMateriais: true, retencaoInss11: true, irrfAliquota: 0.015 },
  { item: '7.09', descricao: 'Varrição, coleta e destinação de lixo e resíduos', local: 'local_da_prestacao', retencaoIssPadrao: true, permiteDeducaoMateriais: false, retencaoInss11: true, irrfAliquota: 0.015 },
  { item: '7.10', descricao: 'Limpeza, manutenção e conservação de imóveis e vias públicas', local: 'local_da_prestacao', retencaoIssPadrao: true, permiteDeducaoMateriais: false, retencaoInss11: true, irrfAliquota: 0.01 },
  { item: '7.11', descricao: 'Decoração e jardinagem, inclusive corte e poda de árvores', local: 'local_da_prestacao', retencaoIssPadrao: true, permiteDeducaoMateriais: false, retencaoInss11: true, irrfAliquota: 0.015 },
  { item: '7.12', descricao: 'Controle e tratamento de efluentes e agentes físicos e biológicos', local: 'local_da_prestacao', retencaoIssPadrao: true, permiteDeducaoMateriais: false, retencaoInss11: false, irrfAliquota: 0.015 },
  { item: '7.19', descricao: 'Acompanhamento e fiscalização da execução de obras', local: 'local_da_prestacao', retencaoIssPadrao: true, permiteDeducaoMateriais: false, retencaoInss11: false, irrfAliquota: 0.015 },
  { item: '10.04', descricao: 'Agenciamento de arrendamento mercantil, franquia e faturização', local: 'domicilio_tomador', retencaoIssPadrao: true, permiteDeducaoMateriais: false, retencaoInss11: false, irrfAliquota: 0.015 },
  { item: '11.02', descricao: 'Vigilância, segurança e monitoramento de bens e pessoas', local: 'local_da_prestacao', retencaoIssPadrao: true, permiteDeducaoMateriais: false, retencaoInss11: true, irrfAliquota: 0.01 },
  { item: '11.04', descricao: 'Armazenamento, depósito, carga, descarga e guarda de bens', local: 'local_da_prestacao', retencaoIssPadrao: true, permiteDeducaoMateriais: false, retencaoInss11: false, irrfAliquota: 0.015 },
  { item: '12.13', descricao: 'Produção de eventos, espetáculos e congressos', local: 'local_da_prestacao', retencaoIssPadrao: true, permiteDeducaoMateriais: false, retencaoInss11: false, irrfAliquota: 0.015 },
  { item: '13.05', descricao: 'Composição gráfica, impressão e acabamentos gráficos', local: 'estabelecimento_prestador', retencaoIssPadrao: false, permiteDeducaoMateriais: false, retencaoInss11: false, irrfAliquota: 0.015 },
  { item: '14.01', descricao: 'Lubrificação, limpeza, revisão e conserto de máquinas e veículos', local: 'estabelecimento_prestador', retencaoIssPadrao: false, permiteDeducaoMateriais: true, retencaoInss11: false, irrfAliquota: 0.015 },
  { item: '14.05', descricao: 'Beneficiamento, lavagem, secagem e acabamento de objetos', local: 'estabelecimento_prestador', retencaoIssPadrao: false, permiteDeducaoMateriais: false, retencaoInss11: false, irrfAliquota: 0.015 },
  { item: '15.09', descricao: 'Arrendamento mercantil (leasing) de quaisquer bens', local: 'domicilio_tomador', retencaoIssPadrao: true, permiteDeducaoMateriais: false, retencaoInss11: false, irrfAliquota: 0 },
  { item: '16.01', descricao: 'Transporte municipal de natureza coletiva ou individual', local: 'local_da_prestacao', retencaoIssPadrao: true, permiteDeducaoMateriais: false, retencaoInss11: false, irrfAliquota: 0.015 },
  { item: '17.01', descricao: 'Assessoria, consultoria, análise e planejamento empresarial', local: 'estabelecimento_prestador', retencaoIssPadrao: false, permiteDeducaoMateriais: false, retencaoInss11: false, irrfAliquota: 0.015 },
  { item: '17.05', descricao: 'Fornecimento de mão de obra, inclusive de empregados do prestador', local: 'domicilio_tomador', retencaoIssPadrao: true, permiteDeducaoMateriais: false, retencaoInss11: true, irrfAliquota: 0.01 },
  { item: '17.06', descricao: 'Propaganda e publicidade, elaboração de campanhas e material', local: 'estabelecimento_prestador', retencaoIssPadrao: false, permiteDeducaoMateriais: false, retencaoInss11: false, irrfAliquota: 0.015 },
  { item: '17.19', descricao: 'Contabilidade, auditoria, perícia e análise de balanços', local: 'estabelecimento_prestador', retencaoIssPadrao: false, permiteDeducaoMateriais: false, retencaoInss11: false, irrfAliquota: 0.015 },
  { item: '17.20', descricao: 'Consultoria e assessoria econômica ou financeira', local: 'estabelecimento_prestador', retencaoIssPadrao: false, permiteDeducaoMateriais: false, retencaoInss11: false, irrfAliquota: 0.015 },
  { item: '26.01', descricao: 'Serviços de coleta, remessa e entrega de correspondências e encomendas', local: 'local_da_prestacao', retencaoIssPadrao: true, permiteDeducaoMateriais: false, retencaoInss11: false, irrfAliquota: 0.015 },
] as const;

const LC116_INDEX = new Map(LISTA_LC116.map((i) => [i.item, i]));

export function buscarItemLc116(item: string): ItemLc116 | undefined {
  return LC116_INDEX.get(item.trim());
}
