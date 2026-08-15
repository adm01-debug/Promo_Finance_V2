// LOGICA DE CLASSIFICACAO POR ANEXO DO SIMPLES NACIONAL
// Extraído de `shared-logic.ts` (modularização max-lines). A tabela ANEXOS e
// `determinarAnexoSimples` permanecem em `shared-logic.ts` por causa do
// drift-guard com a Edge Function (supabase/functions/_shared/tributario-logic.ts).

/**
 * Serviços tributados obrigatoriamente pelo Anexo IV (LC 123/2006, art. 18 §5º-C),
 * onde a CPP fica FORA do DAS (recolhida à parte pela folha).
 */
export const PALAVRAS_ANEXO_IV = [
  'construcao', 'obra', 'edificacao', 'vigilancia', 'seguranca',
  'limpeza', 'conservacao', 'zeladoria', 'portaria', 'advocacia', 'advogado',
];

export const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
