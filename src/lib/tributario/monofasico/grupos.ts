// REGIME MONOFÁSICO PIS/COFINS — Catálogo de grupos e NCMs
// Fonte: Leis 9.718/98, 10.147/00, 10.485/02, 10.833/03, 10.865/04, 11.116/05
// e Decretos 5.059/04 e 6.707/08. Alíquotas em decimal.

import type { GrupoMonofasico } from './types';

const ZERO = { pis: 0, cofins: 0 };

export const GRUPOS_MONOFASICOS: GrupoMonofasico[] = [
  {
    chave: 'COMBUSTIVEIS',
    nome: 'Combustíveis',
    descricao: 'Gasolina, diesel, GLP, etanol combustível e querosene de aviação',
    baseLegal: 'Lei 9.718/98 + Decreto 5.059/04',
    revenda: ZERO,
    prioridade: 10,
    prefixos: ['2710', '2711'],
    ncms: [
      { ncm: '2710.12.4', descricao: 'Gasolina', industria: { pis: 0.0506, cofins: 0.2388 } },
      { ncm: '2710.19.21', descricao: 'Querosene de aviação', industria: { pis: 0.05, cofins: 0.23 } },
      { ncm: '2710.19.32', descricao: 'Óleo diesel', industria: { pis: 0.0496, cofins: 0.2304 } },
      { ncm: '2711.19.10', descricao: 'GLP (botijão)', industria: { pis: 0.0506, cofins: 0.2388 } },
      { ncm: '2207.20.10', descricao: 'Etanol anidro combustível', industria: { pis: 0.0356, cofins: 0.1654 } },
    ],
  },
  {
    chave: 'MEDICAMENTOS_LISTA_POSITIVA',
    nome: 'Medicamentos — lista positiva',
    descricao: 'Contraceptivos, insulina, antibióticos e demais itens do art. 1º da Lei 10.147/00',
    baseLegal: 'Lei 10.147/00, art. 1º',
    industria: { pis: 0.021, cofins: 0.098 },
    revenda: ZERO,
    prioridade: 10,
    prefixos: [],
    ncms: [
      { ncm: '3004.10.00', descricao: 'Medicamentos com penicilinas' },
      { ncm: '3004.31.00', descricao: 'Insulina' },
      { ncm: '3006.60.00', descricao: 'Contraceptivos' },
    ],
  },
  {
    chave: 'MEDICAMENTOS_LISTA_NEGATIVA',
    nome: 'Medicamentos — lista negativa',
    descricao: 'Demais medicamentos e produtos farmacêuticos não listados na lista positiva',
    baseLegal: 'Lei 10.147/00, art. 1º',
    industria: { pis: 0.0224, cofins: 0.108 },
    revenda: ZERO,
    prioridade: 50,
    prefixos: ['3003', '3004', '3006'],
    ncms: [],
  },
  {
    chave: 'PERFUMARIA_COSMETICOS',
    nome: 'Perfumaria, cosméticos e higiene pessoal',
    descricao: 'Perfumes, maquiagem, xampus, desodorantes e sabonetes',
    baseLegal: 'Lei 10.147/00, art. 1º',
    industria: { pis: 0.022, cofins: 0.103 },
    revenda: ZERO,
    prioridade: 10,
    prefixos: ['3303', '3304', '3305', '3307'],
    ncms: [
      { ncm: '3303.00.10', descricao: 'Perfumes' },
      { ncm: '3303.00.20', descricao: 'Águas-de-colônia' },
      { ncm: '3304.10.00', descricao: 'Produtos de maquiagem para os lábios' },
      { ncm: '3304.20.10', descricao: 'Sombras e delineadores' },
      { ncm: '3304.30.00', descricao: 'Preparações para manicure e pedicure' },
      { ncm: '3305.10.00', descricao: 'Xampus' },
      { ncm: '3305.20.00', descricao: 'Permanentes e alisantes' },
      { ncm: '3307.10.00', descricao: 'Preparações para barbear' },
      { ncm: '3307.20.10', descricao: 'Desodorantes e antitranspirantes' },
      { ncm: '3401.11.90', descricao: 'Sabonetes em barra' },
    ],
  },
  {
    chave: 'BEBIDAS_FRIAS',
    nome: 'Bebidas frias',
    descricao: 'Águas, refrigerantes, isotônicos, energéticos, cervejas e vinhos',
    baseLegal: 'Lei 10.833/03 + Decreto 6.707/08',
    industria: { pis: 0.0265, cofins: 0.1223 },
    revenda: ZERO,
    prioridade: 10,
    prefixos: ['2201', '2202', '2203', '2204'],
    ncms: [
      { ncm: '2201.10.00', descricao: 'Águas minerais', industria: { pis: 0.0265, cofins: 0.1223 } },
      { ncm: '2202.10.00', descricao: 'Refrigerantes', industria: { pis: 0.0265, cofins: 0.1223 } },
      { ncm: '2202.99.00', descricao: 'Isotônicos e energéticos', industria: { pis: 0.0265, cofins: 0.1223 } },
      { ncm: '2203.00.00', descricao: 'Cerveja de malte', industria: { pis: 0.0265, cofins: 0.1223 } },
      { ncm: '2204.21.00', descricao: 'Vinho em garrafa', industria: { pis: 0.0265, cofins: 0.1223 } },
    ],
  },
  {
    chave: 'AUTOPECAS',
    nome: 'Autopeças',
    descricao: 'Autopeças destinadas a fabricantes e revendedores de veículos',
    baseLegal: 'Lei 10.485/02',
    industria: { pis: 0.02, cofins: 0.0923 },
    revenda: ZERO,
    prioridade: 20,
    prefixos: ['8407', '8708'],
    ncms: [
      { ncm: '8407.34.00', descricao: 'Motores de pistão alternativo' },
      { ncm: '8708.30.10', descricao: 'Freios e suas partes' },
      { ncm: '8708.99.90', descricao: 'Outras partes e acessórios de veículos' },
    ],
  },
  {
    chave: 'PNEUS_CAMARAS',
    nome: 'Pneus e câmaras de ar',
    descricao: 'Pneumáticos novos e câmaras de ar de borracha',
    baseLegal: 'Lei 10.485/02, art. 5º',
    industria: { pis: 0.02, cofins: 0.0923 },
    revenda: ZERO,
    prioridade: 10,
    prefixos: ['4011', '4013'],
    ncms: [
      { ncm: '4011.10.00', descricao: 'Pneus para automóveis' },
      { ncm: '4011.20.10', descricao: 'Pneus para caminhões e ônibus' },
    ],
  },
  {
    chave: 'BIODIESEL',
    nome: 'Biodiesel',
    descricao: 'Biodiesel B100',
    baseLegal: 'Lei 11.116/05',
    industria: { pis: 0.0612, cofins: 0.2838 },
    revenda: ZERO,
    prioridade: 10,
    prefixos: ['3826'],
    ncms: [{ ncm: '3826.00.00', descricao: 'Biodiesel B100' }],
  },
  {
    chave: 'ALCOOL_ANIDRO',
    nome: 'Álcool, inclusive para fins carburantes',
    descricao: 'Álcool etílico, inclusive carburante',
    baseLegal: 'Lei 9.718/98, art. 5º',
    industria: { pis: 0.0356, cofins: 0.1654 },
    revenda: ZERO,
    prioridade: 20,
    prefixos: ['2207'],
    ncms: [{ ncm: '2207.10.00', descricao: 'Álcool etílico não desnaturado' }],
  },
];

/**
 * Grupo genérico usado quando o catálogo do banco marca como monofásico um NCM
 * que o catálogo embarcado não cobre. Sem alíquota de indústria: o cálculo
 * emite alerta pedindo informação manual em vez de presumir base legal.
 */
export const GRUPO_MONOFASICO_CATALOGO: GrupoMonofasico = {
  chave: 'CATALOGO_BANCO',
  nome: 'Monofásico — catálogo fiscal',
  descricao: 'NCM marcado como monofásico no catálogo versionado, sem grupo legal mapeado no motor',
  baseLegal: 'Catálogo fiscal (ncms.monofasico_pis_cofins)',
  revenda: ZERO,
  prioridade: 100,
  prefixos: [],
  ncms: [],
};

export const GRUPOS_POR_CHAVE: Record<string, GrupoMonofasico> = Object.fromEntries(
  GRUPOS_MONOFASICOS.map((g) => [g.chave, g]),
);

/** Alíquotas do regime normal (cumulativo/não cumulativo) para comparação. */
export const ALIQUOTAS_REGIME_NORMAL = {
  presumido: { pis: 0.0065, cofins: 0.03 },
  real: { pis: 0.0165, cofins: 0.076 },
  simples: { pis: 0, cofins: 0 },
} as const;

/** Prazo decadencial para recuperação de indébito (art. 168 do CTN). */
export const MESES_RECUPERACAO_RETROATIVA = 60;
