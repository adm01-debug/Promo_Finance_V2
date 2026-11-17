import type { RiscoElisao } from '@/lib/tributario/elisao';

export const RISCO_BADGE: Record<RiscoElisao, string> = {
  baixo: 'bg-success/10 text-success border-success/30',
  medio: 'bg-warning/10 text-warning border-warning/30',
  alto: 'bg-destructive/10 text-destructive border-destructive/30',
};

/**
 * Equivalência entre o código do catálogo (public.estrategias_elisao_catalogo,
 * 8 linhas em produção) e o código do detector do motor
 * (src/lib/tributario/elisao/detectar-*.ts, 13 detectores).
 *
 * Os dois conjuntos nasceram em desenhos diferentes e NÃO se cruzam por código:
 * nenhum dos 8 códigos do catálogo aparece em src/. Apenas duas estratégias têm
 * equivalente semântico no motor — as outras seis estão catalogadas com economia
 * estimada e o motor nunca as avalia. É isso que a seção "ainda não avaliadas"
 * da aba Análise mostra, para o valor catalogado não ficar invisível.
 */
export const CATALOGO_PARA_DETECTOR: Record<string, string> = {
  DEP_ACELERADA: 'DEPRECIACAO_ACELERADA',
  INOV_TECNOLOGIA: 'LEI_BEM',
};

export const STATUS_LABEL: Record<string, string> = {
  identificada: 'Identificada',
  em_analise: 'Em análise',
  aprovada: 'Aprovada',
  implementada: 'Implementada',
  descartada: 'Descartada',
};
