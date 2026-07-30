
-- Harden RLS: Replace USING(true) with proper role-based policies

-- MOVIMENTACOES
DROP POLICY IF EXISTS "Auth users can manage movimentacoes" ON movimentacoes;
CREATE POLICY "Fin users can read movimentacoes" ON movimentacoes FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]));
CREATE POLICY "Fin users can insert movimentacoes" ON movimentacoes FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "Fin users can update movimentacoes" ON movimentacoes FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "Admin can delete movimentacoes" ON movimentacoes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- TRANSFERENCIAS
DROP POLICY IF EXISTS "Auth users can manage transferencias" ON transferencias;
CREATE POLICY "Fin users can read transferencias" ON transferencias FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]));
CREATE POLICY "Fin users can insert transferencias" ON transferencias FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "Fin users can update transferencias" ON transferencias FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "Admin can delete transferencias" ON transferencias FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- CONTATOS_FINANCEIROS
DROP POLICY IF EXISTS "Auth users can manage contatos_financeiros" ON contatos_financeiros;
CREATE POLICY "Auth users can read contatos_financeiros" ON contatos_financeiros FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Fin users can manage contatos_financeiros" ON contatos_financeiros FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

-- CATEGORIAS
DROP POLICY IF EXISTS "Auth users can manage categorias" ON categorias;
CREATE POLICY "Auth users can read categorias" ON categorias FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin/fin can manage categorias" ON categorias FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

-- EXTRATO_BANCARIO
DROP POLICY IF EXISTS "Auth users can manage extrato_bancario" ON extrato_bancario;
CREATE POLICY "Fin users can read extrato_bancario" ON extrato_bancario FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]));
CREATE POLICY "Fin users can manage extrato_bancario" ON extrato_bancario FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

-- CONCILIACOES
DROP POLICY IF EXISTS "Auth users can manage conciliacoes" ON conciliacoes;
CREATE POLICY "Fin users can read conciliacoes" ON conciliacoes FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','operacional']::app_role[]));
CREATE POLICY "Fin users can manage conciliacoes" ON conciliacoes FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

-- TEMPLATES_COBRANCA
DROP POLICY IF EXISTS "Auth users can manage templates_cobranca" ON templates_cobranca;
CREATE POLICY "Auth users can read templates_cobranca" ON templates_cobranca FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin can manage templates_cobranca" ON templates_cobranca FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- FILA_COBRANCAS
DROP POLICY IF EXISTS "Auth users can manage fila_cobrancas" ON fila_cobrancas;
CREATE POLICY "Fin users can read fila_cobrancas" ON fila_cobrancas FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "Fin users can manage fila_cobrancas" ON fila_cobrancas FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

-- EXECUCOES_COBRANCA
DROP POLICY IF EXISTS "Auth users can manage execucoes_cobranca" ON execucoes_cobranca;
CREATE POLICY "Fin users can read execucoes_cobranca" ON execucoes_cobranca FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "System can insert execucoes_cobranca" ON execucoes_cobranca FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

-- NEGATIVACOES
DROP POLICY IF EXISTS "Auth users can manage negativacoes" ON negativacoes;
CREATE POLICY "Fin users can read negativacoes" ON negativacoes FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "Fin users can manage negativacoes" ON negativacoes FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

-- PROTESTOS
DROP POLICY IF EXISTS "Auth users can manage protestos" ON protestos;
CREATE POLICY "Fin users can read protestos" ON protestos FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "Fin users can manage protestos" ON protestos FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
