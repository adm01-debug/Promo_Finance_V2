import type { ItemTipi } from './types';

/** Alíquota mínima do ISS — LC 116/2003, art. 8º-A (incluído pela LC 157/2016). */
export const ISS_ALIQUOTA_MINIMA = 0.02;

/** Alíquota máxima do ISS — LC 116/2003, art. 8º, II. */
export const ISS_ALIQUOTA_MAXIMA = 0.05;

/** Retenção de PIS/COFINS/CSLL — Lei 10.833/2003, art. 30 e 31. */
export const CSRF_PIS = 0.0065;

export const CSRF_COFINS = 0.03;

export const CSRF_CSLL = 0.01;

export const CSRF_TOTAL = CSRF_PIS + CSRF_COFINS + CSRF_CSLL;

// 4,65%
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
  {
    ncm: '39241000',
    descricao: 'Serviços de mesa e artigos de plástico para cozinha',
    aliquota: 0.0325,
    situacao: 'tributada',
  },
  {
    ncm: '39264000',
    descricao: 'Estatuetas e outros objetos de ornamentação, de plástico',
    aliquota: 0.0325,
    situacao: 'tributada',
  },
  {
    ncm: '39269090',
    descricao: 'Outras obras de plástico',
    aliquota: 0.0325,
    situacao: 'tributada',
  },
  {
    ncm: '42021200',
    descricao: 'Malas e mochilas com superfície exterior de plástico ou têxtil',
    aliquota: 0.0975,
    situacao: 'tributada',
  },
  {
    ncm: '48201000',
    descricao: 'Agendas, blocos de notas e cadernos',
    aliquota: 0,
    situacao: 'aliquota_zero',
  },
  {
    ncm: '49019900',
    descricao: 'Livros, brochuras e impressos semelhantes',
    aliquota: 0,
    situacao: 'imune',
  },
  {
    ncm: '61091000',
    descricao: 'Camisetas de malha de algodão',
    aliquota: 0,
    situacao: 'nao_tributada',
  },
  {
    ncm: '62052000',
    descricao: 'Camisas de algodão, de uso masculino',
    aliquota: 0,
    situacao: 'nao_tributada',
  },
  {
    ncm: '63071000',
    descricao: 'Rodilhas, esfregões e flanelas',
    aliquota: 0,
    situacao: 'nao_tributada',
  },
  {
    ncm: '65050090',
    descricao: 'Bonés e outros chapéus de matérias têxteis',
    aliquota: 0,
    situacao: 'nao_tributada',
  },
  {
    ncm: '69120000',
    descricao: 'Louça e artigos de cerâmica para uso doméstico',
    aliquota: 0.0325,
    situacao: 'tributada',
  },
  { ncm: '70133700', descricao: 'Outros copos de vidro', aliquota: 0.065, situacao: 'tributada' },
  {
    ncm: '73239300',
    descricao: 'Artigos de uso doméstico de aço inoxidável (garrafas térmicas)',
    aliquota: 0.0325,
    situacao: 'tributada',
  },
  {
    ncm: '82055900',
    descricao: 'Outras ferramentas manuais',
    aliquota: 0.0325,
    situacao: 'tributada',
  },
  {
    ncm: '84713012',
    descricao: 'Máquinas automáticas para processamento de dados, portáteis',
    aliquota: 0.0975,
    situacao: 'tributada',
  },
  {
    ncm: '85234110',
    descricao: 'Discos e mídias ópticas não gravadas',
    aliquota: 0.15,
    situacao: 'tributada',
  },
  {
    ncm: '85234910',
    descricao: 'Cartões de memória e pen drives',
    aliquota: 0.15,
    situacao: 'tributada',
  },
  {
    ncm: '85171231',
    descricao: 'Telefones celulares (smartphones)',
    aliquota: 0.0325,
    situacao: 'tributada',
  },
  {
    ncm: '85183000',
    descricao: 'Fones de ouvido e conjuntos microfone/altifalante',
    aliquota: 0.0975,
    situacao: 'tributada',
  },
  {
    ncm: '85076000',
    descricao: 'Acumuladores de íon de lítio (power banks)',
    aliquota: 0.0975,
    situacao: 'tributada',
  },
  { ncm: '91029900', descricao: 'Outros relógios de pulso', aliquota: 0.2, situacao: 'tributada' },
  { ncm: '96081000', descricao: 'Canetas esferográficas', aliquota: 0.0975, situacao: 'tributada' },
  {
    ncm: '96170010',
    descricao: 'Garrafas térmicas e outros recipientes isotérmicos',
    aliquota: 0.0975,
    situacao: 'tributada',
  },
  { ncm: '95030099', descricao: 'Outros brinquedos', aliquota: 0, situacao: 'aliquota_zero' },
  { ncm: '33030010', descricao: 'Perfumes', aliquota: 0.42, situacao: 'tributada' },
  { ncm: '22030000', descricao: 'Cervejas de malte', aliquota: 0, situacao: 'nao_tributada' },
] as const;

export const TIPI_INDEX: Record<string, ItemTipi> = Object.fromEntries(TIPI.map((i) => [i.ncm, i]));

/** Normaliza o NCM removendo pontos, traços e espaços. */
export function normalizarNcm(ncm: string): string {
  return (ncm ?? '').replace(/\D/g, '');
}

/**
 * Tabela de IPI efetiva usada em runtime. Por padrão é o índice da TIPI
 * embarcada; pode ser substituída pelo overlay já validado do catálogo do
 * banco via `definirTabelaTipiEfetiva`. Nunca aceita valores não validados —
 * o chamador deve usar `aplicarOverlayNcm` antes.
 */
export let tabelaTipiEfetiva: Record<string, ItemTipi> = TIPI_INDEX;

/** Substitui a tabela efetiva de IPI (uso exclusivo do carregador de catálogos). */
export function definirTabelaTipiEfetiva(tabela: Record<string, ItemTipi>): void {
  tabelaTipiEfetiva = tabela;
}

/** Restaura a TIPI canônica embarcada no código. */
export function resetarTabelaTipiEfetiva(): void {
  tabelaTipiEfetiva = TIPI_INDEX;
}

/** Tabela de IPI atualmente em uso pelo motor. */
export function obterTabelaTipiEfetiva(): Record<string, ItemTipi> {
  return tabelaTipiEfetiva;
}

/** Busca o item da TIPI pelo NCM (aceita máscara). Retorna `undefined` se não catalogado. */
export function buscarTipi(ncm: string): ItemTipi | undefined {
  return tabelaTipiEfetiva[normalizarNcm(ncm)];
}

/** Busca estritamente na TIPI embarcada, ignorando o overlay (uso das guardas de drift). */
export function buscarTipiCanonica(ncm: string): ItemTipi | undefined {
  return TIPI_INDEX[normalizarNcm(ncm)];
}
