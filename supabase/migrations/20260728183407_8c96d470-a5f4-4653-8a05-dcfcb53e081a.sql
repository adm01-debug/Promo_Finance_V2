-- Gap #28 (correção detectada pelo invariante 17 da baseline)
-- O schema public tem DEFAULT PRIVILEGES concedendo escrita a authenticated em
-- tabelas novas. A trilha do digest é a trava de idempotência do resumo
-- semanal: se o cliente puder inserir, ele forja "digest já enviado" e cala a
-- notificação; se puder apagar, dispara o envio em loop. Escrita só pelo
-- agendador (service_role).
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.frontend_error_silence_digest_log FROM anon, authenticated;

GRANT SELECT ON public.frontend_error_silence_digest_log TO authenticated;
GRANT ALL    ON public.frontend_error_silence_digest_log TO service_role;