export interface DrillDownState {
  open: boolean;
  titulo?: string;
  subtitulo?: string;
  centro_resultado?: string;
  tipo_bp?: 'circulante_ativo' | 'nao_circ_ativo' | 'circulante_pas' | 'nao_circ_pas' | 'pl';
  natureza?: string;
}

export type ModoDemonstrativo = 'dre' | 'balanco';

export function inferCentroResultado(codigo: string): string | undefined {
  if (codigo === '1') return 'receita_operacional';
  if (codigo === '4') return 'cmv';
  if (codigo === '6.1') return 'despesa_administrativa';
  if (codigo === '6.2') return 'despesa_comercial';
  return undefined;
}

export function inferTipoBpAtivo(codigo: string): DrillDownState['tipo_bp'] {
  if (codigo === '1.1') return 'circulante_ativo';
  if (codigo === '1.2') return 'nao_circ_ativo';
  return undefined;
}

export function inferTipoBpPassivo(codigo: string): DrillDownState['tipo_bp'] {
  if (codigo === '2.1') return 'circulante_pas';
  if (codigo === '2.2') return 'nao_circ_pas';
  if (codigo === '3') return 'pl';
  return undefined;
}
