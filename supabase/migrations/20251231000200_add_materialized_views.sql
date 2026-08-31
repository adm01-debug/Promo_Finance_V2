-- Protótipos legados de materialized views, supersedidos antes da consolidação
-- do schema canônico.
--
-- Evidência revalidada em 2026-08-31:
--   * nenhuma das quatro views existe no projeto bwwbeyolnnzppeuhgkcd;
--   * nenhuma delas possui consumidor no código da aplicação;
--   * as definições antigas usam colunas e estados incompatíveis com o schema
--     consolidado (`vencimento`, `fornecedores.nome`, entre outros).
--
-- Executar esse protótipo num replay limpo criaria objetos que não pertencem ao
-- canônico. A migration permanece registrada como marco histórico, sem DDL.
DO $legacy_materialized_views$
BEGIN
  NULL;
END
$legacy_materialized_views$;
