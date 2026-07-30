-- GAP #30 — Isolamento do caminho de LEITURA (superfície `authenticated`)
-- 1) cnpja_cache: contém dados cadastrais completos (razão social, endereço, QSA/sócios)
--    de CNPJs consultados por TODOS os tenants. É lido exclusivamente pela edge function
--    `cnpja-lookup` via service_role. A leitura por `authenticated` permitia enumeração
--    global do cache (vazamento cross-tenant + PII de sócios / LGPD).
DROP POLICY IF EXISTS "cnpja_cache_select" ON public.cnpja_cache;
DROP POLICY IF EXISTS "Authenticated users can read cnpja cache" ON public.cnpja_cache;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.cnpja_cache FROM authenticated;
REVOKE ALL ON public.cnpja_cache FROM anon;
GRANT ALL ON public.cnpja_cache TO service_role;

CREATE POLICY "cnpja_cache_service_role_only"
  ON public.cnpja_cache FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- 2) overlay_rejeicoes_auditoria: trilha operacional interna (valores recebidos brutos
--    de catálogos externos). Escrita já é restrita a admin/manager, mas a LEITURA era
--    aberta a todo authenticated. Alinhar leitura ao mesmo predicado de papel.
DROP POLICY IF EXISTS "Autenticados leem auditoria de overlay" ON public.overlay_rejeicoes_auditoria;

CREATE POLICY "Gestores leem auditoria de overlay"
  ON public.overlay_rejeicoes_auditoria FOR SELECT
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin'::app_role)
    OR has_role((SELECT auth.uid()), 'manager'::app_role)
  );

REVOKE ALL ON public.overlay_rejeicoes_auditoria FROM anon;