// Enums e types unions da reforma tributária.

export type RegimeTributario = 'lucro_real' | 'lucro_presumido' | 'simples_nacional' | 'mei';

export type TipoTributoNovo = 'CBS' | 'IBS' | 'IS';
export type TipoTributoAntigo = 'ICMS' | 'ISS' | 'PIS' | 'COFINS' | 'IPI';

export type FaseTransicao =
  | '2026_teste'
  | '2027_cbs_plena'
  | '2028_cbs_plena'
  | '2029_transicao'
  | '2030_transicao'
  | '2031_transicao'
  | '2032_transicao'
  | '2033_pleno';

export type CategoriaIS =
  | 'bebidas_alcoolicas'
  | 'bebidas_acucaradas'
  | 'produtos_fumigenos'
  | 'veiculos'
  | 'embarcacoes_aeronaves'
  | 'minerios'
  | 'combustiveis_fosseis'
  | 'concursos_prognosticos';

export type StatusCreditoTributario =
  | 'disponivel'
  | 'utilizado'
  | 'compensado'
  | 'expirado'
  | 'estornado'
  | 'transferido';

export type TipoOperacao =
  | 'venda'
  | 'compra'
  | 'servico_prestado'
  | 'servico_tomado'
  | 'importacao'
  | 'exportacao';

export type RegimeEspecial =
  | 'zona_franca_manaus'
  | 'combustiveis'
  | 'servicos_financeiros'
  | 'imobiliario'
  | 'hotelaria'
  | 'bares_restaurantes'
  | 'parques_diversao'
  | 'agencias_viagem'
  | 'transporte_coletivo'
  | 'sociedades_cooperativas'
  | 'nenhum';
