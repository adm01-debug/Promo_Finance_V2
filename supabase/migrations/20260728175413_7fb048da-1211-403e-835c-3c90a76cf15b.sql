DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lalamove_uapi_sessions') THEN
    -- Gap #25: cofre de sessões UAPI não deve ser acessível a visitantes anônimos.
    REVOKE ALL ON TABLE public.lalamove_uapi_sessions FROM anon;
    -- Autenticados mantêm acesso apenas via política "Admins can manage UAPI sessions".
    REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
      ON TABLE public.lalamove_uapi_sessions FROM authenticated;
    GRANT SELECT ON TABLE public.lalamove_uapi_sessions TO authenticated;
    GRANT ALL ON TABLE public.lalamove_uapi_sessions TO service_role;
  END IF;
END;
$$;
