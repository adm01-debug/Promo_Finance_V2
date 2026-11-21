import type { CategoriaIS } from './enums';

/**
 * Catálogo de categorias do Imposto Seletivo (LC 214/2025 arts. 393-400).
 * Sem `aliquotaBase`/`aliquotaMaxima`: a lei ainda não regulamentou alíquotas
 * para a maior parte destas categorias (ADR-003, achado #6, PR #490). O
 * cálculo usa só a alíquota que o usuário informar — nunca um valor
 * fabricado por categoria.
 */
export interface ConfiguracaoIS {
  categoria: CategoriaIS;
  descricao: string;
  fundamentoLegal: string;
}

export const CONFIGURACOES_IS: ConfiguracaoIS[] = [
  {
    categoria: 'bebidas_alcoolicas',
    descricao: 'Bebidas alcoólicas',
    fundamentoLegal: 'Art. 393 LC 214/2025',
  },
  {
    categoria: 'bebidas_acucaradas',
    descricao: 'Bebidas açucaradas',
    fundamentoLegal: 'Art. 394 LC 214/2025',
  },
  {
    categoria: 'produtos_fumigenos',
    descricao: 'Produtos fumígenos (cigarros, charutos)',
    fundamentoLegal: 'Art. 395 LC 214/2025',
  },
  {
    categoria: 'veiculos',
    descricao: 'Veículos motorizados',
    fundamentoLegal: 'Art. 396 LC 214/2025',
  },
  {
    categoria: 'embarcacoes_aeronaves',
    descricao: 'Embarcações e aeronaves',
    fundamentoLegal: 'Art. 397 LC 214/2025',
  },
  {
    categoria: 'minerios',
    descricao: 'Extração de minérios',
    fundamentoLegal: 'Art. 398 LC 214/2025',
  },
  {
    categoria: 'combustiveis_fosseis',
    descricao: 'Combustíveis fósseis',
    fundamentoLegal: 'Art. 399 LC 214/2025',
  },
  {
    categoria: 'concursos_prognosticos',
    descricao: 'Loterias e apostas',
    fundamentoLegal: 'Art. 400 LC 214/2025',
  },
];
