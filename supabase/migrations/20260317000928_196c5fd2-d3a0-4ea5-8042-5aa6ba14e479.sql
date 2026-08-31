-- Protótipo histórico de aliases GENERATED e triggers locais, supersedido pela
-- consolidação posterior do módulo financeiro.
--
-- Revalidação em 2026-08-31:
--   * o schema canônico não contém essas colunas GENERATED;
--   * as funções/triggers `fn_sync_valor_*`, `fn_transferencia_movimentacao`
--     e correlatas não existem no banco canônico;
--   * `contas_receber.valor_recebido` e outros campos usados aqui ainda não
--     existem neste ponto do replay limpo, porque as tabelas-base nasceram em
--     `001_create_tables.sql` e a migration consolidada de 2025 não os
--     acrescentou por usar `CREATE TABLE IF NOT EXISTS`.
--
-- Executar este arquivo no replay criaria drift ou quebraria a sequência
-- histórica antes das migrations de maio/2026 que definem o contrato
-- consolidado. Mantemos a versão como marco histórico, deliberadamente sem DDL.
DO $legacy_generated_aliases$
BEGIN
  NULL;
END
$legacy_generated_aliases$;
