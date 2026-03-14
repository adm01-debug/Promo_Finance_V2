-- Rodada final: endurecer tabelas tributárias, pagamentos recorrentes, alertas preditivos, recomendações e login_attempts

-- 1) 12 tabelas tributárias: restringir a financeiro/admin
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['apuracoes_tributarias','operacoes_tributaveis','creditos_tributarios','split_payment_transacoes','regimes_especiais_empresa','apuracoes_irpj_csll','prejuizos_fiscais','lalur_lancamentos','incentivos_fiscais','retencoes_fonte','darfs','per_dcomp'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Drop broad policies
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can view %1$s" ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can insert %1$s" ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can update %1$s" ON public.%1$I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can delete %1$s" ON public.%1$I', t);

    -- Create role-scoped policies
    EXECUTE format('CREATE POLICY "Financeiro+ podem ver %1$s" ON public.%1$I FOR SELECT TO authenticated USING (public.has_any_role(auth.uid(), ARRAY[''admin''::public.app_role, ''financeiro''::public.app_role]))', t);
    EXECUTE format('CREATE POLICY "Financeiro+ podem inserir %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY[''admin''::public.app_role, ''financeiro''::public.app_role]))', t);
    EXECUTE format('CREATE POLICY "Financeiro+ podem atualizar %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY[''admin''::public.app_role, ''financeiro''::public.app_role])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY[''admin''::public.app_role, ''financeiro''::public.app_role]))', t);
    EXECUTE format('CREATE POLICY "Admin pode deletar %1$s" ON public.%1$I FOR DELETE TO authenticated USING (public.has_role(auth.uid(), ''admin''::public.app_role))', t);
  END LOOP;
END$$;

-- 2) pagamentos_recorrentes: restringir leitura e escrita
DROP POLICY IF EXISTS "Authenticated users can view pagamentos_recorrentes" ON public.pagamentos_recorrentes;
DROP POLICY IF EXISTS "Authenticated users can update pagamentos_recorrentes" ON public.pagamentos_recorrentes;

CREATE POLICY "Operacional+ podem ver pagamentos_recorrentes"
ON public.pagamentos_recorrentes FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role, 'operacional'::public.app_role]));

CREATE POLICY "Financeiro+ podem atualizar pagamentos_recorrentes"
ON public.pagamentos_recorrentes FOR UPDATE TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 3) alertas_preditivos: restringir SELECT de alertas de sistema
DROP POLICY IF EXISTS "Usuários podem ver seus alertas preditivos" ON public.alertas_preditivos;
CREATE POLICY "Usuários podem ver alertas preditivos com escopo"
ON public.alertas_preditivos FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR (user_id IS NULL AND public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]))
);

-- 4) recomendacoes_metas_ia: restringir SELECT
DROP POLICY IF EXISTS "Usuários autenticados podem ver recomendações" ON public.recomendacoes_metas_ia;
CREATE POLICY "Financeiro+ podem ver recomendações"
ON public.recomendacoes_metas_ia FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 5) login_attempts: restringir INSERT a server-side function
DROP POLICY IF EXISTS "System can insert login attempts" ON public.login_attempts;
CREATE POLICY "Usuários podem registrar próprias tentativas"
ON public.login_attempts FOR INSERT TO authenticated
WITH CHECK (user_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

-- 6) portal_cliente_acessos INSERT: restringir a autenticados
DROP POLICY IF EXISTS "Acessos podem ser registrados publicamente" ON public.portal_cliente_acessos;
CREATE POLICY "Autenticados podem registrar acessos"
ON public.portal_cliente_acessos FOR INSERT TO authenticated
WITH CHECK (token_id IS NOT NULL AND acao IS NOT NULL AND length(trim(acao)) > 0);