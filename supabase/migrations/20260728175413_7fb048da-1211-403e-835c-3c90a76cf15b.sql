-- Gap #25: cofre de sessões UAPI não deve ser acessível a visitantes anônimos.
-- A tabela guarda cookies/tokens de sessão da integração Lalamove e é usada
-- exclusivamente por edge functions (service_role) e administradores.
-- Nota: tabela pode não existir em Preview (sem CREATE TABLE na history).
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = 'lalamove_uapi_sessions') THEN
    REVOKE ALL ON TABLE public.lalamove_uapi_sessions FROM anon;
    -- Autenticados mantêm acesso apenas via política "Admins can manage UAPI sessions".
    REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
      ON TABLE public.lalamove_uapi_sessions FROM authenticated;
    GRANT SELECT ON TABLE public.lalamove_uapi_sessions TO authenticated;
    GRANT ALL ON TABLE public.lalamove_uapi_sessions TO service_role;
  END IF;
END $$;
