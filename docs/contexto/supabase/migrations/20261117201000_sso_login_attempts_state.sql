-- Religa o login federado (SSO): `state` e `expires_at` de sso_login_attempts.
--
-- As duas colunas são declaradas em `20260421125350` e não existem no banco
-- canônico — mesmo drift de `docs/agentes/auditoria-drift-banco-2026-11-17.md`.
-- Sem elas o fluxo PKCE não fecha em nenhuma das duas pontas:
--
--   * `supabase/functions/sso-initiate/index.ts:123` insere a tentativa com
--     `state`, `code_verifier_hash` e `expires_at`. Um INSERT com coluna
--     inválida é recusado por inteiro, então a tentativa nunca é gravada;
--   * `supabase/functions/sso-callback/index.ts:888` procura a tentativa por
--     `.eq('state', state)`. Filtro em coluna inexistente faz a consulta falhar,
--     então nem o `app_redirect` nem o `code_verifier_hash` são recuperados.
--
-- Estas duas escaparam do inventário da PR #437 porque `state` e `expires_at`
-- entram no insert como propriedade abreviada (`{ state, expires_at }`, sem
-- `chave:`), e o detector de chaves de primeiro nível só casava `chave:`.
--
-- Tipos lidos do catálogo do replay. Só ADD COLUMN IF NOT EXISTS, ambas
-- nuláveis, nenhum dado alterado; a tabela está vazia em produção.

ALTER TABLE public.sso_login_attempts ADD COLUMN IF NOT EXISTS state text

ALTER TABLE public.sso_login_attempts ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone

-- O callback procura a tentativa mais recente por state; sem índice isso é
-- varredura numa tabela que cresce a cada login. Uso o índice exatamente como
-- as migrations o declaram — parcial, só onde state não é nulo — em vez de
-- inventar outro nome: `idx_sso_attempts_state`.
--
-- Nota: produção tem apenas a PK nesta tabela, enquanto as migrations declaram
-- 8 índices. O resto dessa diferença não entra aqui; é drift de índice, uma
-- dimensão que a auditoria da PR #437 não cobriu, e vai registrada como
-- próximo passo em vez de virar carona nesta correção.
CREATE INDEX IF NOT EXISTS idx_sso_attempts_state
  ON public.sso_login_attempts(state)
  WHERE state IS NOT NULL
