-- Auditoria de segurança: endurecimento de RLS e funções para validação de acesso sem expor configurações sensíveis

-- 1) Funções de validação para login (evita expor whitelist de IP/geo no cliente)
CREATE OR REPLACE FUNCTION public.is_ip_allowed_for_login(_ip text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_restrict_by_ip boolean := false;
  v_global_ips text[] := ARRAY[]::text[];
BEGIN
  SELECT COALESCE(restrict_by_ip, false), COALESCE(allowed_global_ips, ARRAY[]::text[])
  INTO v_restrict_by_ip, v_global_ips
  FROM public.security_settings
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT v_restrict_by_ip THEN
    RETURN true;
  END IF;

  IF _ip IS NULL OR length(trim(_ip)) = 0 THEN
    RETURN true;
  END IF;

  IF _ip = ANY(v_global_ips) THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.allowed_ips ai
    WHERE ai.ativo = true
      AND ai.ip_address = _ip
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_country_allowed_for_login(_country text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_geo_enabled boolean := false;
BEGIN
  SELECT COALESCE(enable_geo_restriction, false)
  INTO v_geo_enabled
  FROM public.security_settings
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT v_geo_enabled THEN
    RETURN true;
  END IF;

  IF _country IS NULL OR length(trim(_country)) = 0 THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.allowed_countries ac
    WHERE ac.ativo = true
      AND ac.country_code = _country
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_ip_allowed_for_login(text) TO public;
GRANT EXECUTE ON FUNCTION public.is_country_allowed_for_login(text) TO public;

-- 2) alertas: remover leitura pública indireta e inserção ampla
DROP POLICY IF EXISTS "Users can view own alertas" ON public.alertas;
DROP POLICY IF EXISTS "System can insert alertas" ON public.alertas;
DROP POLICY IF EXISTS "Users can update own alertas" ON public.alertas;

CREATE POLICY "Users can view own or privileged system alertas"
ON public.alertas
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR (
    user_id IS NULL
    AND public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
  )
);

CREATE POLICY "Users can insert own or privileged system alertas"
ON public.alertas
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    user_id = auth.uid()
    OR (
      user_id IS NULL
      AND public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
    )
  )
);

CREATE POLICY "Users can update own or privileged system alertas"
ON public.alertas
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
)
WITH CHECK (
  auth.uid() = user_id
  OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
);

-- 3) vendedores: exigir autenticação para leitura e restringir escrita por papel
DROP POLICY IF EXISTS "Usuários autenticados podem ver vendedores" ON public.vendedores;
DROP POLICY IF EXISTS "Financeiro+ podem gerenciar vendedores" ON public.vendedores;

CREATE POLICY "Usuários autenticados podem ver vendedores"
ON public.vendedores
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Financeiro+ podem gerenciar vendedores"
ON public.vendedores
FOR ALL
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 4) security_settings: somente admin lê/altera configurações completas
DROP POLICY IF EXISTS "Usuários autenticados podem ver configurações" ON public.security_settings;
DROP POLICY IF EXISTS "Admins podem atualizar configurações" ON public.security_settings;

CREATE POLICY "Admins podem ver configurações"
ON public.security_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem atualizar configurações"
ON public.security_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5) historico_relatorios: leitura restrita por dono ou papel elevado
DROP POLICY IF EXISTS "Users can view report history" ON public.historico_relatorios;
DROP POLICY IF EXISTS "System can insert report history" ON public.historico_relatorios;

CREATE POLICY "Users can view own report history or elevated"
ON public.historico_relatorios
FOR SELECT
TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
  OR EXISTS (
    SELECT 1
    FROM public.relatorios_agendados ra
    WHERE ra.id = historico_relatorios.relatorio_agendado_id
      AND ra.created_by = auth.uid()
  )
);

CREATE POLICY "Users can insert own report history or elevated"
ON public.historico_relatorios
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
  OR EXISTS (
    SELECT 1
    FROM public.relatorios_agendados ra
    WHERE ra.id = historico_relatorios.relatorio_agendado_id
      AND ra.created_by = auth.uid()
  )
);

-- 6) historico_analises_preditivas: restringir por ownership/papel
DROP POLICY IF EXISTS "Usuários autenticados podem ver histórico de análises" ON public.historico_analises_preditivas;
DROP POLICY IF EXISTS "Sistema pode inserir análises" ON public.historico_analises_preditivas;

CREATE POLICY "Usuários podem ver próprias análises ou papel elevado"
ON public.historico_analises_preditivas
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
);

CREATE POLICY "Usuários podem inserir próprias análises ou papel elevado"
ON public.historico_analises_preditivas
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
);

-- 7) historico_score_saude: restringir a perfis financeiros/admin
DROP POLICY IF EXISTS "Usuários autenticados podem ver histórico de score" ON public.historico_score_saude;
DROP POLICY IF EXISTS "Sistema pode inserir scores" ON public.historico_score_saude;

CREATE POLICY "Financeiro e admin podem ver histórico de score"
ON public.historico_score_saude
FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

CREATE POLICY "Financeiro e admin podem inserir histórico de score"
ON public.historico_score_saude
FOR INSERT
TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 8) alertas_tributarios: remover ALL amplo e aplicar ownership/papel
DROP POLICY IF EXISTS "alertas_tributarios_all" ON public.alertas_tributarios;

CREATE POLICY "Users can view own or elevated alertas_tributarios"
ON public.alertas_tributarios
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
);

CREATE POLICY "Users can insert own or elevated alertas_tributarios"
ON public.alertas_tributarios
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
);

CREATE POLICY "Users can update own or elevated alertas_tributarios"
ON public.alertas_tributarios
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
)
WITH CHECK (
  user_id = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
);

CREATE POLICY "Users can delete own or elevated alertas_tributarios"
ON public.alertas_tributarios
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
);

-- 9) portal_cliente_acessos: restringir leitura de logs sensíveis
DROP POLICY IF EXISTS "Usuários autenticados podem ver acessos" ON public.portal_cliente_acessos;

CREATE POLICY "Financeiro e admin podem ver acessos"
ON public.portal_cliente_acessos
FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 10) relatorios_agendados: leitura ampla -> dono ou papel elevado
DROP POLICY IF EXISTS "Users can view scheduled reports" ON public.relatorios_agendados;
DROP POLICY IF EXISTS "Users can create scheduled reports" ON public.relatorios_agendados;
DROP POLICY IF EXISTS "Users can update their scheduled reports" ON public.relatorios_agendados;
DROP POLICY IF EXISTS "Users can delete their scheduled reports" ON public.relatorios_agendados;

CREATE POLICY "Users can view own scheduled reports or elevated"
ON public.relatorios_agendados
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
);

CREATE POLICY "Users can create scheduled reports"
ON public.relatorios_agendados
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own scheduled reports or elevated"
ON public.relatorios_agendados
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
)
WITH CHECK (
  created_by = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
);

CREATE POLICY "Users can delete own scheduled reports or elevated"
ON public.relatorios_agendados
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role])
);