-- Restaura a garantia "uma conta a pagar so pode estar vinculada a UMA NFe".
--
-- Origem da perda: branch claude/chore-ddl-steps12-23-311026-1942 (PR #232,
-- fechada), arquivo step13_remove_duplicate_indexes.sql, Lote 3. Aquele step
-- tratou uq_nfe_rec_conta_pagar como par duplicado de
-- idx_nfe_recebidas_conta_pagar_id_fk e derrubou o UNIQUE em producao. Nao sao
-- par: o derrubado e UNIQUE PARCIAL, o mantido e btree comum e nao garante
-- unicidade nenhuma.
--
-- O indice original esta em
-- 20260723120045_20cca17b-987b-414b-a7c5-b3a13bdc1c26.sql:7-9, com o comentario
-- "Garante unicidade: uma conta_pagar so pode estar vinculada a UMA NFe", mas a
-- cadeia nunca o derruba — ou seja, repositorio e producao divergem e a regra
-- existe apenas no repositorio.
--
-- Por que importa agora: nfe_create_conta_pagar_from_nfe e o fluxo que preenche
-- nfe_recebidas.conta_pagar_id, e ele voltou a funcionar para emitente novo com
-- a #381 (fornecedores.empresa_id). Sem o UNIQUE, duas notas podem apontar para
-- a mesma conta a pagar e o titulo e pago uma vez por nota.
--
-- Seguro de aplicar hoje: conferido no canonico bwwbeyolnnzppeuhgkcd que
-- nfe_recebidas tem 31 linhas e ZERO com conta_pagar_id preenchido, logo nao ha
-- duplicidade que impeca a criacao.
CREATE UNIQUE INDEX IF NOT EXISTS uq_nfe_rec_conta_pagar
  ON public.nfe_recebidas(conta_pagar_id)
  WHERE conta_pagar_id IS NOT NULL;
