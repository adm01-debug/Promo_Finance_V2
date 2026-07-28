-- Gap #25: cofre de sessões UAPI não deve ser acessível a visitantes anônimos.
-- A tabela guarda cookies/tokens de sessão da integração Lalamove e é usada
-- exclusivamente por edge functions (service_role) e administradores.
REVOKE ALL ON TABLE public.lalamove_uapi_sessions FROM anon;

-- Autenticados mantêm acesso apenas via política "Admins can manage UAPI sessions".
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.lalamove_uapi_sessions FROM authenticated;
GRANT SELECT ON TABLE public.lalamove_uapi_sessions TO authenticated;
GRANT ALL ON TABLE public.lalamove_uapi_sessions TO service_role;