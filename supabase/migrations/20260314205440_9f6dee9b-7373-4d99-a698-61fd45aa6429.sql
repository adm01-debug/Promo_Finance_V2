-- Security hardening: remove overly broad authenticated-write policies

-- 1) security_settings: only admins can mutate
DROP POLICY IF EXISTS "security_settings_all" ON public.security_settings;
CREATE POLICY "Admins can insert security settings"
ON public.security_settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete security settings"
ON public.security_settings
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2) account_lockouts: remove broad ALL; restrict reads/changes to admins
DROP POLICY IF EXISTS "System can manage account lockouts" ON public.account_lockouts;

CREATE POLICY "Admins can view account lockouts"
ON public.account_lockouts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update account lockouts"
ON public.account_lockouts
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete account lockouts"
ON public.account_lockouts
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3) user_sessions: remove broad ALL and keep user-scoped writes
DROP POLICY IF EXISTS "System can manage sessions" ON public.user_sessions;

CREATE POLICY "Users can insert own sessions"
ON public.user_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
ON public.user_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4) portal_cliente_tokens: remove public/any-auth access, restrict to finance/admin
DROP POLICY IF EXISTS "Tokens podem ser validados publicamente" ON public.portal_cliente_tokens;
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar tokens" ON public.portal_cliente_tokens;

CREATE POLICY "Financeiro e admin podem gerenciar tokens"
ON public.portal_cliente_tokens
FOR ALL
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 5) solicitacoes_aprovacao: require authenticated users for SELECT
DROP POLICY IF EXISTS "Authenticated users can view solicitacoes_aprovacao" ON public.solicitacoes_aprovacao;
CREATE POLICY "Authenticated users can view solicitacoes_aprovacao"
ON public.solicitacoes_aprovacao
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- 6) password_reset_requests: avoid fully-open WITH CHECK(true)
DROP POLICY IF EXISTS "Qualquer um pode criar solicitação de reset" ON public.password_reset_requests;
CREATE POLICY "Qualquer um pode criar solicitação de reset"
ON public.password_reset_requests
FOR INSERT
TO public
WITH CHECK (
  status = 'pendente'
  AND user_email IS NOT NULL
  AND length(trim(user_email)) >= 5
  AND position('@' in user_email) > 1
);

-- 7) portal_cliente_acessos: avoid fully-open WITH CHECK(true)
DROP POLICY IF EXISTS "Acessos podem ser registrados publicamente" ON public.portal_cliente_acessos;
CREATE POLICY "Acessos podem ser registrados publicamente"
ON public.portal_cliente_acessos
FOR INSERT
TO public
WITH CHECK (
  token_id IS NOT NULL
  AND acao IS NOT NULL
  AND length(trim(acao)) > 0
);

-- 8) rate_limit_logs: remove broad ALL; keep admin access only
DROP POLICY IF EXISTS "System can manage rate limit logs" ON public.rate_limit_logs;

CREATE POLICY "Admins can update rate limit logs"
ON public.rate_limit_logs
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete rate limit logs"
ON public.rate_limit_logs
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 9) blocked_ips: remove redundant broad insert policy
DROP POLICY IF EXISTS "System can insert blocked IPs" ON public.blocked_ips;

-- 10) historico_cobranca_whatsapp: restrict sensitive reads to financeiro/admin
DROP POLICY IF EXISTS "Usuários autenticados podem ver histórico de cobrança" ON public.historico_cobranca_whatsapp;
CREATE POLICY "Financeiro e admin podem ver histórico de cobrança"
ON public.historico_cobranca_whatsapp
FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'financeiro'::public.app_role]));

-- 11) mutable function search_path warning
ALTER FUNCTION public.update_updated_at() SET search_path = public;