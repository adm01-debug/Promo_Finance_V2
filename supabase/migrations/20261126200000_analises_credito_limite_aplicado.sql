-- Marca quando o limite aprovado foi gravado no cadastro do cliente.
--
-- A decisão é gravada antes de escrever o limite no cadastro; se a execução da
-- edge function credito-analise parar no meio, o reenvio ao Champions completa
-- a aprovação. Sem esta marca, esse reenvio reescreveria um limite que o
-- Finance pode ter ajustado no cadastro depois da decisão.

ALTER TABLE public.analises_credito
  ADD COLUMN IF NOT EXISTS limite_aplicado_em timestamptz;

COMMENT ON COLUMN public.analises_credito.limite_aplicado_em IS
  'Quando o limite aprovado foi gravado no cadastro do cliente; reenvio ao Champions não reescreve limite já aplicado.';
