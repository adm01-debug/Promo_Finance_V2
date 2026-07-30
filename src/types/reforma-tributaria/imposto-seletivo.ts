import type { CategoriaIS } from './enums';

export interface ConfiguracaoIS {
  categoria: CategoriaIS;
  aliquotaBase: number;
  aliquotaMaxima: number;
  descricao: string;
  fundamentoLegal: string;
}

export const CONFIGURACOES_IS: ConfiguracaoIS[] = [
  { categoria: 'bebidas_alcoolicas', aliquotaBase: 20, aliquotaMaxima: 35, descricao: 'Bebidas alcoólicas', fundamentoLegal: 'Art. 393 LC 214/2025' },
  { categoria: 'bebidas_acucaradas', aliquotaBase: 10, aliquotaMaxima: 20, descricao: 'Bebidas açucaradas', fundamentoLegal: 'Art. 394 LC 214/2025' },
  { categoria: 'produtos_fumigenos', aliquotaBase: 25, aliquotaMaxima: 50, descricao: 'Produtos fumígenos (cigarros, charutos)', fundamentoLegal: 'Art. 395 LC 214/2025' },
  { categoria: 'veiculos', aliquotaBase: 1, aliquotaMaxima: 8, descricao: 'Veículos motorizados', fundamentoLegal: 'Art. 396 LC 214/2025' },
  { categoria: 'embarcacoes_aeronaves', aliquotaBase: 1, aliquotaMaxima: 5, descricao: 'Embarcações e aeronaves', fundamentoLegal: 'Art. 397 LC 214/2025' },
  { categoria: 'minerios', aliquotaBase: 0.5, aliquotaMaxima: 2, descricao: 'Extração de minérios', fundamentoLegal: 'Art. 398 LC 214/2025' },
  { categoria: 'combustiveis_fosseis', aliquotaBase: 5, aliquotaMaxima: 15, descricao: 'Combustíveis fósseis', fundamentoLegal: 'Art. 399 LC 214/2025' },
  { categoria: 'concursos_prognosticos', aliquotaBase: 12, aliquotaMaxima: 25, descricao: 'Loterias e apostas', fundamentoLegal: 'Art. 400 LC 214/2025' },
];
