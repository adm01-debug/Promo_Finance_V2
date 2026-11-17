-- Desativa as faixas de alcada DUPLICADAS, sem apagar nenhuma linha.
--
-- `public.configuracoes_aprovacao` tinha 6 linhas para UMA empresa: as faixas
-- de 5.000, 50.000 e 999.999 semeadas DUAS vezes em 2026-07-28 (19:09:01 e
-- 19:16:39), todas com `ativo = true` e `aprovadores_obrigatorios = 1`.
--
-- Efeito na tela: a gravacao do painel de governanca recusa qualquer valor que
-- nao possa virar o limite efetivo, e com a duplicata no MESMO valor a "outra
-- faixa ativa" era a propria faixa editada -- o painel ficava travado para
-- qualquer alteracao (ver PR #400, rodadas 6 a 8).
--
-- Aqui NAO se apaga dado: a duplicata mais nova de cada (empresa, valor) fica
-- `ativo = false`. Sobram 3 faixas ativas, uma por patamar, e as 3 linhas
-- desativadas seguem no banco para auditoria e para reversao (basta voltar
-- `ativo = true`).
--
-- Aplicado em producao antes deste arquivo (AGENTS.md secao 4). Verificado:
--   5000   -> 2 linhas, 1 ativa | 50000 -> 2 linhas, 1 ativa
--   999999 -> 2 linhas, 1 ativa
UPDATE public.configuracoes_aprovacao c
   SET ativo = false,
       updated_at = now()
 WHERE c.ativo = true
   AND EXISTS (
     SELECT 1
       FROM public.configuracoes_aprovacao m
      WHERE m.empresa_id = c.empresa_id
        AND m.valor_minimo_aprovacao = c.valor_minimo_aprovacao
        AND m.ativo = true
        AND (m.created_at < c.created_at OR (m.created_at = c.created_at AND m.id < c.id))
   );
