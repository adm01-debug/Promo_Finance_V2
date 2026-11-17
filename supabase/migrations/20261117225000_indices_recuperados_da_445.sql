-- Recupera 43 dos 67 índices declarados que a PR #445 deixou de fora.
--
-- A #445 criou 63 índices nas tabelas financeiras e excluiu 67 porque eles
-- referenciavam coluna que produção não tinha. Reconferido hoje, coluna por
-- coluna, contra information_schema: só 22 colunas estão realmente ausentes.
-- Os 43 índices abaixo referenciam apenas colunas que existem — inclusive
-- movimentacoes.centro_custo_id, que passou a existir com a 20261117220000.
--
-- NÃO entram aqui, com o motivo medido:
--
--   * 22 índices dependem de coluna ausente e seguem impossíveis:
--       boletos.transacao_conciliada_id, clientes.contato_financeiro_id,
--       clientes.vendedor_id, contas_pagar.contato_id,
--       contas_pagar.forma_pagamento_id, contas_pagar.idempotency_key,
--       contas_pagar.is_frete, contas_pagar.plano_conta_id,
--       contas_receber.categoria, contas_receber.contato_id,
--       contas_receber.forma_pagamento_id, contas_receber.plano_conta_id,
--       extrato_bancario.empresa_id, extrato_bancario.transacao_bancaria_id,
--       fornecedores.categoria, fornecedores.contato_financeiro_id,
--       notas_fiscais.cliente_id, notas_fiscais.created_by,
--       transacoes_bancarias.conciliada_por, transacoes_bancarias.conciliado,
--       transacoes_bancarias.conta_pagar_id, transacoes_bancarias.conta_receber_id
--     São colunas de uma segunda geração do schema que nenhuma linha de código
--     escreve ou lê hoje. Criá-las para então indexá-las seria churn.
--
--   * 2 índices UNIQUE anti-duplicata não podem ser criados com o dado atual:
--       idx_contas_pagar_prevent_duplicates
--       idx_contas_receber_prevent_duplicates
--     Medido em produção: 6 grupos duplicados em contas_pagar e 6 em
--     contas_receber pela chave (fornecedor/cliente, valor, data_vencimento,
--     numero_documento) com status <> 'cancelado'. Criar o índice exige
--     deduplicar primeiro, o que apaga linha — decisão do dono, não de agente.
--
-- Todos CREATE INDEX IF NOT EXISTS, sem CONCURRENTLY (falha no gateway
-- transacional, AGENTS §4). Já aplicados e conferidos em produção: os 43
-- nomes presentes em pg_indexes, 0 índice inválido.

CREATE INDEX IF NOT EXISTS idx_boletos_conta_bancaria_id ON public.boletos USING btree (conta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_boletos_conta_pagar_id ON public.boletos USING btree (conta_pagar_id);
CREATE INDEX IF NOT EXISTS idx_boletos_created_by_fk ON public.boletos USING btree (created_by);
CREATE INDEX IF NOT EXISTS idx_boletos_empresa_id ON public.boletos USING btree (empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_user_id_fk ON public.clientes USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_conciliacoes_conta_bancaria_id_fk ON public.conciliacoes USING btree (conta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_aprovado_por_fk ON public.contas_pagar USING btree (aprovado_por);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_categoria_id_fk ON public.contas_pagar USING btree (categoria_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_centro_custo_id ON public.contas_pagar USING btree (centro_custo_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_conta_bancaria_id ON public.contas_pagar USING btree (conta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_data_pagamento ON public.contas_pagar USING btree (data_pagamento) WHERE (data_pagamento IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_empresa_id ON public.contas_pagar USING btree (empresa_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_empresa_status_venc ON public.contas_pagar USING btree (empresa_id, status, data_vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_fornecedor_id_fk ON public.contas_pagar USING btree (fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_pendentes_venc ON public.contas_pagar USING btree (empresa_id, data_vencimento) WHERE ((status)::text = 'pendente'::text);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_user_created ON public.contas_pagar USING btree (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cp_pendentes ON public.contas_pagar USING btree (data_vencimento) WHERE ((status)::text = ANY ((ARRAY['pendente'::character varying, 'vencida'::character varying])::text[]));
CREATE INDEX IF NOT EXISTS idx_contas_receber_categoria_id ON public.contas_receber USING btree (categoria_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_centro_custo_id ON public.contas_receber USING btree (centro_custo_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_cliente_id ON public.contas_receber USING btree (cliente_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_conta_bancaria_id ON public.contas_receber USING btree (conta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_data_recebimento ON public.contas_receber USING btree (data_recebimento) WHERE (data_recebimento IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_contas_receber_empresa_id ON public.contas_receber USING btree (empresa_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_empresa_status_venc ON public.contas_receber USING btree (empresa_id, status, data_vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_receber_pendentes_venc ON public.contas_receber USING btree (empresa_id, data_vencimento) WHERE ((status)::text = 'pendente'::text);
CREATE INDEX IF NOT EXISTS idx_contas_receber_user_created ON public.contas_receber USING btree (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cr_pendentes ON public.contas_receber USING btree (data_vencimento) WHERE ((status)::text = ANY ((ARRAY['pendente'::character varying, 'vencida'::character varying])::text[]));
CREATE INDEX IF NOT EXISTS idx_extrato_bancario_conta_bancaria_id_fk ON public.extrato_bancario USING btree (conta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_empresa_id ON public.fornecedores USING btree (empresa_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_user_id_fk ON public.fornecedores USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_contabeis_empresa_user ON public.lancamentos_contabeis USING btree (empresa_id, user_id);
CREATE INDEX IF NOT EXISTS lancamentos_contabeis_empresa_data_idx ON public.lancamentos_contabeis USING btree (empresa_id, data_lancamento);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_categoria_id ON public.movimentacoes USING btree (categoria_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_centro_custo_id_fk ON public.movimentacoes USING btree (centro_custo_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_conta_bancaria_id ON public.movimentacoes USING btree (conta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_empresa_data ON public.movimentacoes USING btree (empresa_id, data_movimentacao) WHERE (deleted_at IS NULL);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_empresa_id ON public.movimentacoes USING btree (empresa_id);
CREATE INDEX IF NOT EXISTS idx_partidas_contabeis_conta_contabil_id_fk ON public.partidas_contabeis USING btree (conta_contabil_id);
CREATE INDEX IF NOT EXISTS idx_partidas_contabeis_empresa_id ON public.partidas_contabeis USING btree (empresa_id);
CREATE INDEX IF NOT EXISTS idx_partidas_contabeis_lancamento_id ON public.partidas_contabeis USING btree (lancamento_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_bancarias_confirmado_por_fk ON public.transacoes_bancarias USING btree (confirmado_por);
CREATE INDEX IF NOT EXISTS idx_transacoes_bancarias_regra_id_fk ON public.transacoes_bancarias USING btree (regra_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_pendentes ON public.transacoes_bancarias USING btree (conta_bancaria_id, data DESC) WHERE (status = 'pendente'::text);
