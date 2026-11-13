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

import type { ItemLc116 } from './types';

/**
 * Lista de serviços da LC 116/2003 — recorte operacional.
 *
 * `local` reflete o art. 3º: a regra geral é o estabelecimento prestador
 * (caput) e os incisos I a XXV são as exceções (local da execução) — os itens
 * 4.22, 4.23, 5.09, 15.09, 10.04 e 17.05 seguem o domicílio do tomador.
 */
export const LISTA_LC116: readonly ItemLc116[] = [
  {
    item: '1.01',
    descricao: 'Análise e desenvolvimento de sistemas',
    local: 'estabelecimento_prestador',
    retencaoIssPadrao: false,
    permiteDeducaoMateriais: false,
    retencaoInss11: false,
    irrfAliquota: 0.015,
  },
  {
    item: '1.05',
    descricao: 'Licenciamento ou cessão de direito de uso de programas de computação',
    local: 'estabelecimento_prestador',
    retencaoIssPadrao: false,
    permiteDeducaoMateriais: false,
    retencaoInss11: false,
    irrfAliquota: 0.015,
  },
  {
    item: '1.07',
    descricao: 'Suporte técnico em informática, inclusive instalação e configuração',
    local: 'estabelecimento_prestador',
    retencaoIssPadrao: false,
    permiteDeducaoMateriais: false,
    retencaoInss11: false,
    irrfAliquota: 0.015,
  },
  {
    item: '4.03',
    descricao: 'Hospitais, clínicas, laboratórios e pronto-socorros',
    local: 'estabelecimento_prestador',
    retencaoIssPadrao: false,
    permiteDeducaoMateriais: false,
    retencaoInss11: false,
    irrfAliquota: 0.015,
  },
  {
    item: '4.22',
    descricao: 'Planos de medicina de grupo ou individual',
    local: 'domicilio_tomador',
    retencaoIssPadrao: true,
    permiteDeducaoMateriais: false,
    retencaoInss11: false,
    irrfAliquota: 0,
  },
  {
    item: '5.09',
    descricao: 'Planos de atendimento e assistência médico-veterinária',
    local: 'domicilio_tomador',
    retencaoIssPadrao: true,
    permiteDeducaoMateriais: false,
    retencaoInss11: false,
    irrfAliquota: 0,
  },
  {
    item: '7.02',
    descricao: 'Execução de obras de construção civil, hidráulica ou elétrica',
    local: 'local_da_prestacao',
    retencaoIssPadrao: true,
    permiteDeducaoMateriais: true,
    retencaoInss11: true,
    irrfAliquota: 0.015,
  },
  {
    item: '7.05',
    descricao: 'Reparação, conservação e reforma de edifícios e estradas',
    local: 'local_da_prestacao',
    retencaoIssPadrao: true,
    permiteDeducaoMateriais: true,
    retencaoInss11: true,
    irrfAliquota: 0.015,
  },
  {
    item: '7.09',
    descricao: 'Varrição, coleta e destinação de lixo e resíduos',
    local: 'local_da_prestacao',
    retencaoIssPadrao: true,
    permiteDeducaoMateriais: false,
    retencaoInss11: true,
    irrfAliquota: 0.015,
  },
  {
    item: '7.10',
    descricao: 'Limpeza, manutenção e conservação de imóveis e vias públicas',
    local: 'local_da_prestacao',
    retencaoIssPadrao: true,
    permiteDeducaoMateriais: false,
    retencaoInss11: true,
    irrfAliquota: 0.01,
  },
  {
    item: '7.11',
    descricao: 'Decoração e jardinagem, inclusive corte e poda de árvores',
    local: 'local_da_prestacao',
    retencaoIssPadrao: true,
    permiteDeducaoMateriais: false,
    retencaoInss11: true,
    irrfAliquota: 0.015,
  },
  {
    item: '7.12',
    descricao: 'Controle e tratamento de efluentes e agentes físicos e biológicos',
    local: 'local_da_prestacao',
    retencaoIssPadrao: true,
    permiteDeducaoMateriais: false,
    retencaoInss11: false,
    irrfAliquota: 0.015,
  },
  {
    item: '7.19',
    descricao: 'Acompanhamento e fiscalização da execução de obras',
    local: 'local_da_prestacao',
    retencaoIssPadrao: true,
    permiteDeducaoMateriais: false,
    retencaoInss11: false,
    irrfAliquota: 0.015,
  },
  {
    item: '10.04',
    descricao: 'Agenciamento de arrendamento mercantil, franquia e faturização',
    local: 'domicilio_tomador',
    retencaoIssPadrao: true,
    permiteDeducaoMateriais: false,
    retencaoInss11: false,
    irrfAliquota: 0.015,
  },
  {
    item: '11.02',
    descricao: 'Vigilância, segurança e monitoramento de bens e pessoas',
    local: 'local_da_prestacao',
    retencaoIssPadrao: true,
    permiteDeducaoMateriais: false,
    retencaoInss11: true,
    irrfAliquota: 0.01,
  },
  {
    item: '11.04',
    descricao: 'Armazenamento, depósito, carga, descarga e guarda de bens',
    local: 'local_da_prestacao',
    retencaoIssPadrao: true,
    permiteDeducaoMateriais: false,
    retencaoInss11: false,
    irrfAliquota: 0.015,
  },
  {
    item: '12.13',
    descricao: 'Produção de eventos, espetáculos e congressos',
    local: 'local_da_prestacao',
    retencaoIssPadrao: true,
    permiteDeducaoMateriais: false,
    retencaoInss11: false,
    irrfAliquota: 0.015,
  },
  {
    item: '13.05',
    descricao: 'Composição gráfica, impressão e acabamentos gráficos',
    local: 'estabelecimento_prestador',
    retencaoIssPadrao: false,
    permiteDeducaoMateriais: false,
    retencaoInss11: false,
    irrfAliquota: 0.015,
  },
  {
    item: '14.01',
    descricao: 'Lubrificação, limpeza, revisão e conserto de máquinas e veículos',
    local: 'estabelecimento_prestador',
    retencaoIssPadrao: false,
    permiteDeducaoMateriais: true,
    retencaoInss11: false,
    irrfAliquota: 0.015,
  },
  {
    item: '14.05',
    descricao: 'Beneficiamento, lavagem, secagem e acabamento de objetos',
    local: 'estabelecimento_prestador',
    retencaoIssPadrao: false,
    permiteDeducaoMateriais: false,
    retencaoInss11: false,
    irrfAliquota: 0.015,
  },
  {
    item: '15.09',
    descricao: 'Arrendamento mercantil (leasing) de quaisquer bens',
    local: 'domicilio_tomador',
    retencaoIssPadrao: true,
    permiteDeducaoMateriais: false,
    retencaoInss11: false,
    irrfAliquota: 0,
  },
  {
    item: '16.01',
    descricao: 'Transporte municipal de natureza coletiva ou individual',
    local: 'local_da_prestacao',
    retencaoIssPadrao: true,
    permiteDeducaoMateriais: false,
    retencaoInss11: false,
    irrfAliquota: 0.015,
  },
  {
    item: '17.01',
    descricao: 'Assessoria, consultoria, análise e planejamento empresarial',
    local: 'estabelecimento_prestador',
    retencaoIssPadrao: false,
    permiteDeducaoMateriais: false,
    retencaoInss11: false,
    irrfAliquota: 0.015,
  },
  {
    item: '17.05',
    descricao: 'Fornecimento de mão de obra, inclusive de empregados do prestador',
    local: 'domicilio_tomador',
    retencaoIssPadrao: true,
    permiteDeducaoMateriais: false,
    retencaoInss11: true,
    irrfAliquota: 0.01,
  },
  {
    item: '17.06',
    descricao: 'Propaganda e publicidade, elaboração de campanhas e material',
    local: 'estabelecimento_prestador',
    retencaoIssPadrao: false,
    permiteDeducaoMateriais: false,
    retencaoInss11: false,
    irrfAliquota: 0.015,
  },
  {
    item: '17.19',
    descricao: 'Contabilidade, auditoria, perícia e análise de balanços',
    local: 'estabelecimento_prestador',
    retencaoIssPadrao: false,
    permiteDeducaoMateriais: false,
    retencaoInss11: false,
    irrfAliquota: 0.015,
  },
  {
    item: '17.20',
    descricao: 'Consultoria e assessoria econômica ou financeira',
    local: 'estabelecimento_prestador',
    retencaoIssPadrao: false,
    permiteDeducaoMateriais: false,
    retencaoInss11: false,
    irrfAliquota: 0.015,
  },
  {
    item: '26.01',
    descricao: 'Serviços de coleta, remessa e entrega de correspondências e encomendas',
    local: 'local_da_prestacao',
    retencaoIssPadrao: true,
    permiteDeducaoMateriais: false,
    retencaoInss11: false,
    irrfAliquota: 0.015,
  },
] as const;

const LC116_INDEX = new Map(LISTA_LC116.map((i) => [i.item, i]));

export function buscarItemLc116(item: string): ItemLc116 | undefined {
  return LC116_INDEX.get(item.trim());
}
