-- Revoga EXECUTE das RPCs migradas para Edge Functions (service_role via proxy).
-- Mantém as legadas confirmar_conciliacao/desfazer_conciliacao (ainda usadas por fluxos admin).

REVOKE EXECUTE ON FUNCTION public.nfe_suggest_contas_pagar(p_nfe_id uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.nfe_link_conta_pagar(p_nfe_id uuid, p_conta_pagar_id uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.nfe_unlink_conta_pagar(p_nfe_id uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.nfe_create_conta_pagar_from_nfe(p_nfe_id uuid, p_data_vencimento date, p_categoria_id uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.confirmar_conciliacao_manual(p_transacao_id uuid, p_conta_pagar_id uuid, p_conta_receber_id uuid, p_ajuste_centavos numeric) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.desfazer_conciliacao_manual(p_transacao_id uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_reconciliation_suggestions(p_empresa_id uuid, p_transaction_date date, p_transaction_value numeric, p_transaction_id uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.nfe_suggest_contas_pagar(p_nfe_id uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.nfe_link_conta_pagar(p_nfe_id uuid, p_conta_pagar_id uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.nfe_unlink_conta_pagar(p_nfe_id uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.nfe_create_conta_pagar_from_nfe(p_nfe_id uuid, p_data_vencimento date, p_categoria_id uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.confirmar_conciliacao_manual(p_transacao_id uuid, p_conta_pagar_id uuid, p_conta_receber_id uuid, p_ajuste_centavos numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.desfazer_conciliacao_manual(p_transacao_id uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_reconciliation_suggestions(p_empresa_id uuid, p_transaction_date date, p_transaction_value numeric, p_transaction_id uuid) TO service_role;