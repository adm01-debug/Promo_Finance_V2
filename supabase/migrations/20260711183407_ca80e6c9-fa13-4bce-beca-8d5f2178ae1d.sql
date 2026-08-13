-- reprocess_dlq: admin-only, remover anon
REVOKE EXECUTE ON FUNCTION public.reprocess_dlq(uuid, text) FROM anon, PUBLIC;

-- profile_sensitive_fields_unchanged: usada apenas em triggers, não precisa exposição a clientes
REVOKE EXECUTE ON FUNCTION public.profile_sensitive_fields_unchanged(uuid, uuid, text, uuid) FROM anon, authenticated, PUBLIC;

-- confirmar_envio_cobranca: invocada apenas por Edge Functions (service_role)
REVOKE EXECUTE ON FUNCTION public.confirmar_envio_cobranca(uuid, text, text, boolean, text) FROM anon, authenticated, PUBLIC;

-- Comentários explicativos
COMMENT ON FUNCTION public.reprocess_dlq(uuid, text) IS 'Admin-only: valida has_role(admin) internamente. Removido acesso anon.';
COMMENT ON FUNCTION public.profile_sensitive_fields_unchanged(uuid, uuid, text, uuid) IS 'Helper de trigger — invocado internamente pelo Postgres, não por clientes.';
COMMENT ON FUNCTION public.confirmar_envio_cobranca(uuid, text, text, boolean, text) IS 'Consumido apenas por Edge Functions com service_role.';