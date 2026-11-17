-- Cria os 63 índices declarados pelas migrations e ausentes em produção nas
-- 12 tabelas financeiras centrais.
--
-- Medição de 17/11/2026, replay das 1034 migrations contra o projeto canônico:
-- produção tem 688 índices e as migrations declaram 1111 — 430 ausentes em 160
-- tabelas. Drift de índice é uma dimensão que a auditoria de
-- docs/agentes/auditoria-drift-banco-2026-11-17.md não cobriu: ela comparou tabelas
-- e colunas. Esta migration cobre as 12 tabelas do caminho financeiro, onde o
-- déficit é maior. Sem esses índices, filtro por empresa, por vencimento e por
-- status varre a tabela inteira.
--
-- As definições são as do catálogo do banco de replay, não escritas à mão: é o que a
-- própria história das migrations declara, com índice parcial e expressão incluídos.
-- Índice de PK e de constraint ficam fora — esses vêm com ADD CONSTRAINT.
--
-- Dos 91 ausentes nessas tabelas, 28 ficaram de fora porque referenciam
-- coluna que também não existe em produção (ex.: contas_pagar.plano_conta_id,
-- transacoes_bancarias.conta_receber_id). Criá-los falharia; entram quando a coluna
-- correspondente for reconciliada.
--
-- `CREATE INDEX` simples, sem CONCURRENTLY, como manda AGENTS.md §4 (CONCURRENTLY
-- falha no gateway transacional). Seguro aqui: nenhuma destas 12 tabelas passa de
-- alguns milhares de linhas. IF NOT EXISTS em todos, logo idempotente.

-- boletos (4)
CREATE INDEX IF NOT EXISTS idx_boletos_conta_receber_id ON public.boletos USING btree (conta_receber_id);
CREATE INDEX IF NOT EXISTS idx_boletos_status ON public.boletos USING btree (status);
CREATE INDEX IF NOT EXISTS idx_boletos_user_id_fk ON public.boletos USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_boletos_vencimento ON public.boletos USING btree (vencimento);

-- clientes (6)
CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON public.clientes USING btree (ativo);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf_cnpj ON public.clientes USING btree (cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa_id_fk ON public.clientes USING btree (empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON public.clientes USING btree (nome);
CREATE INDEX IF NOT EXISTS idx_clientes_ramo_atividade ON public.clientes USING btree (ramo_atividade);
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON public.clientes USING btree (user_id);

-- conciliacoes (2)
CREATE INDEX IF NOT EXISTS idx_conciliacoes_empresa_id_fk ON public.conciliacoes USING btree (empresa_id);
CREATE INDEX IF NOT EXISTS idx_conciliacoes_user_id_fk ON public.conciliacoes USING btree (user_id);

-- contas_pagar (11)
CREATE INDEX IF NOT EXISTS idx_contas_pagar_categoria ON public.contas_pagar USING btree (categoria);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_data_vencimento ON public.contas_pagar USING btree (data_vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_fornecedor ON public.contas_pagar USING btree (fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_fornecedor_id ON public.contas_pagar USING btree (fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_status ON public.contas_pagar USING btree (status);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_user_id ON public.contas_pagar USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_vencimento ON public.contas_pagar USING btree (data_vencimento);
CREATE INDEX IF NOT EXISTS idx_cp_descricao_gin ON public.contas_pagar USING gin (to_tsvector('portuguese'::regconfig, (descricao)::text));
CREATE INDEX IF NOT EXISTS idx_cp_fornecedor_status ON public.contas_pagar USING btree (fornecedor_id, status);
CREATE INDEX IF NOT EXISTS idx_cp_status_data_vencimento ON public.contas_pagar USING btree (status, data_vencimento);
CREATE INDEX IF NOT EXISTS idx_cp_status_vencimento ON public.contas_pagar USING btree (status, data_vencimento);

-- contas_receber (10)
CREATE INDEX IF NOT EXISTS idx_contas_receber_cliente ON public.contas_receber USING btree (cliente_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_data_vencimento ON public.contas_receber USING btree (data_vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_receber_status ON public.contas_receber USING btree (status);
CREATE INDEX IF NOT EXISTS idx_contas_receber_transacao_conciliada_id_fk ON public.contas_receber USING btree (transacao_conciliada_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_user_id ON public.contas_receber USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_vencimento ON public.contas_receber USING btree (data_vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_receber_vendedor_id ON public.contas_receber USING btree (vendedor_id);
CREATE INDEX IF NOT EXISTS idx_cr_cliente_status ON public.contas_receber USING btree (cliente_id, status);
CREATE INDEX IF NOT EXISTS idx_cr_descricao_gin ON public.contas_receber USING gin (to_tsvector('portuguese'::regconfig, (descricao)::text));
CREATE INDEX IF NOT EXISTS idx_cr_status_vencimento ON public.contas_receber USING btree (status, data_vencimento);

-- extrato_bancario (1)
CREATE INDEX IF NOT EXISTS idx_extrato_bancario_user_id_fk ON public.extrato_bancario USING btree (user_id);

-- fornecedores (5)
CREATE INDEX IF NOT EXISTS idx_fornecedores_ativo ON public.fornecedores USING btree (ativo);
CREATE INDEX IF NOT EXISTS idx_fornecedores_cnpj ON public.fornecedores USING btree (cnpj);
CREATE INDEX IF NOT EXISTS idx_fornecedores_empresa_id_fk ON public.fornecedores USING btree (empresa_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_razao_social ON public.fornecedores USING btree (razao_social);
CREATE INDEX IF NOT EXISTS idx_fornecedores_user_id ON public.fornecedores USING btree (user_id);

-- lancamentos_contabeis (4)
CREATE INDEX IF NOT EXISTS idx_lanc_emp_data ON public.lancamentos_contabeis USING btree (empresa_id, data_lancamento DESC);
CREATE INDEX IF NOT EXISTS idx_lanc_origem ON public.lancamentos_contabeis USING btree (origem, origem_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_contabeis_user_id_fk ON public.lancamentos_contabeis USING btree (user_id);
CREATE INDEX IF NOT EXISTS lancamentos_contabeis_empresa_comp_idx ON public.lancamentos_contabeis USING btree (empresa_id, competencia);

-- movimentacoes (4)
CREATE INDEX IF NOT EXISTS idx_movimentacoes_conta_bancaria_id_fk ON public.movimentacoes USING btree (conta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_conta_pagar_id_fk ON public.movimentacoes USING btree (conta_pagar_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_conta_receber_id_fk ON public.movimentacoes USING btree (conta_receber_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_empresa_id_fk ON public.movimentacoes USING btree (empresa_id);

-- notas_fiscais (5)
CREATE INDEX IF NOT EXISTS idx_nfe_data_emissao ON public.notas_fiscais USING btree (data_emissao);
CREATE INDEX IF NOT EXISTS idx_nfe_numero ON public.notas_fiscais USING btree (numero);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_data ON public.notas_fiscais USING btree (data_emissao);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_empresa_id_fk ON public.notas_fiscais USING btree (empresa_id);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_status ON public.notas_fiscais USING btree (status);

-- partidas_contabeis (4)
CREATE INDEX IF NOT EXISTS idx_partidas_conta ON public.partidas_contabeis USING btree (conta_id);
CREATE INDEX IF NOT EXISTS idx_partidas_lanc ON public.partidas_contabeis USING btree (lancamento_id);
CREATE INDEX IF NOT EXISTS partidas_contabeis_conta_idx ON public.partidas_contabeis USING btree (conta_id);
CREATE INDEX IF NOT EXISTS partidas_contabeis_conta_lanc_idx ON public.partidas_contabeis USING btree (conta_id, lancamento_id) INCLUDE (tipo, valor);

-- transacoes_bancarias (7)
CREATE INDEX IF NOT EXISTS idx_transacoes_bancarias_created_at ON public.transacoes_bancarias USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transacoes_bancarias_empresa_data ON public.transacoes_bancarias USING btree (conta_bancaria_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_transacoes_compensacao_aceita_em ON public.transacoes_bancarias USING btree (compensacao_aceita_em);
CREATE INDEX IF NOT EXISTS idx_transacoes_compensacao_aceita_por ON public.transacoes_bancarias USING btree (compensacao_aceita_por);
CREATE INDEX IF NOT EXISTS idx_transacoes_compensacao_classificacao ON public.transacoes_bancarias USING btree (compensacao_classificacao);
CREATE INDEX IF NOT EXISTS idx_transacoes_conta ON public.transacoes_bancarias USING btree (conta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_data ON public.transacoes_bancarias USING btree (data);
