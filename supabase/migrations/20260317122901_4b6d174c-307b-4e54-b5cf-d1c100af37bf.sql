
-- 1. ponto_departamentos
CREATE TABLE public.ponto_departamentos (
  id serial PRIMARY KEY,
  nome varchar(200),
  cargo varchar(200),
  responsavel varchar(200),
  codigo_firebird integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.ponto_departamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view ponto_departamentos" ON public.ponto_departamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage ponto_departamentos" ON public.ponto_departamentos FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

-- 2. ponto_funcionarios
CREATE TABLE public.ponto_funcionarios (
  id serial PRIMARY KEY,
  nome varchar(100),
  cpf varchar(15),
  rg varchar(15),
  pis varchar(15),
  matricula varchar(20),
  cracha varchar(20),
  funcao varchar(100),
  email varchar(100),
  telefone varchar(20),
  celular varchar(20),
  data_nascimento date,
  data_admissao date,
  data_desligamento date,
  situacao varchar(20) DEFAULT 'ATIVO',
  empresa_codigo integer,
  departamento_id integer REFERENCES public.ponto_departamentos(id),
  codigo_firebird integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.ponto_funcionarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view ponto_funcionarios" ON public.ponto_funcionarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage ponto_funcionarios" ON public.ponto_funcionarios FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

-- 3. ponto_registros
CREATE TABLE public.ponto_registros (
  id serial PRIMARY KEY,
  funcionario_id integer REFERENCES public.ponto_funcionarios(id),
  data_batida date,
  entrada_1 time, saida_1 time,
  entrada_2 time, saida_2 time,
  entrada_3 time, saida_3 time,
  entrada_4 time, saida_4 time,
  entrada_5 time, saida_5 time,
  entrada_6 time, saida_6 time,
  abono time, abono_negativo time,
  justificativa_abono integer,
  folga integer, neutro integer,
  horario_codigo integer,
  dados_brutos jsonb, observacoes jsonb,
  codigo_firebird integer,
  sincronizado_em timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.ponto_registros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view ponto_registros" ON public.ponto_registros FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage ponto_registros" ON public.ponto_registros FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

-- 4. ponto_sync_log
CREATE TABLE public.ponto_sync_log (
  id serial PRIMARY KEY,
  status varchar(20) DEFAULT 'running',
  inicio timestamptz, fim timestamptz,
  departamentos_sincronizados integer DEFAULT 0,
  funcionarios_sincronizados integer DEFAULT 0,
  registros_novos integer DEFAULT 0,
  registros_atualizados integer DEFAULT 0,
  erro text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.ponto_sync_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view ponto_sync_log" ON public.ponto_sync_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage ponto_sync_log" ON public.ponto_sync_log FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

-- 5. Triggers updated_at
CREATE TRIGGER update_ponto_departamentos_updated_at BEFORE UPDATE ON public.ponto_departamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ponto_funcionarios_updated_at BEFORE UPDATE ON public.ponto_funcionarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ponto_registros_updated_at BEFORE UPDATE ON public.ponto_registros FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. RPC fn_verificar_vencidos
CREATE OR REPLACE FUNCTION public.fn_verificar_vencidos()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.contas_pagar SET status = 'vencido' WHERE status = 'pendente' AND data_vencimento < CURRENT_DATE;
  UPDATE public.contas_receber SET status = 'vencido' WHERE status = 'pendente' AND data_vencimento < CURRENT_DATE;
END;
$$;
