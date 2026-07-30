-- Remove conflicting broad policies that override role-restricted ones

-- Tributárias
DROP POLICY IF EXISTS "Usuários autenticados podem ver apurações" ON public.apuracoes_tributarias;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir apurações" ON public.apuracoes_tributarias;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar apurações" ON public.apuracoes_tributarias;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar apurações" ON public.apuracoes_tributarias;

DROP POLICY IF EXISTS "Usuários autenticados podem ver operações" ON public.operacoes_tributaveis;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir operações" ON public.operacoes_tributaveis;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar operações" ON public.operacoes_tributaveis;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar operações" ON public.operacoes_tributaveis;

DROP POLICY IF EXISTS "Usuários autenticados podem ver créditos" ON public.creditos_tributarios;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir créditos" ON public.creditos_tributarios;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar créditos" ON public.creditos_tributarios;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar créditos" ON public.creditos_tributarios;

DROP POLICY IF EXISTS "Auth users can manage apuracoes_irpj" ON public.apuracoes_irpj_csll;
DROP POLICY IF EXISTS "retencoes_fonte_all" ON public.retencoes_fonte;
DROP POLICY IF EXISTS "darfs_all" ON public.darfs;
DROP POLICY IF EXISTS "per_dcomp_all" ON public.per_dcomp;

DROP POLICY IF EXISTS "split_payment_all" ON public.split_payment_transacoes;
DROP POLICY IF EXISTS "Usuários autenticados podem ver split payment" ON public.split_payment_transacoes;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir split payment" ON public.split_payment_transacoes;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar split payment" ON public.split_payment_transacoes;

DROP POLICY IF EXISTS "Auth users can manage regimes_especiais" ON public.regimes_especiais_empresa;
DROP POLICY IF EXISTS "Usuários autenticados podem ver regimes especiais" ON public.regimes_especiais_empresa;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir regimes especiais" ON public.regimes_especiais_empresa;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar regimes especiais" ON public.regimes_especiais_empresa;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar regimes especiais" ON public.regimes_especiais_empresa;

DROP POLICY IF EXISTS "Auth users can manage prejuizos" ON public.prejuizos_fiscais;
DROP POLICY IF EXISTS "Auth users can manage lalur" ON public.lalur_lancamentos;
DROP POLICY IF EXISTS "Auth users can manage incentivos" ON public.incentivos_fiscais;

-- Pagamentos recorrentes
DROP POLICY IF EXISTS "Usuários autenticados podem ver pagamentos recorrentes" ON public.pagamentos_recorrentes;
DROP POLICY IF EXISTS "Usuários podem atualizar pagamentos recorrentes" ON public.pagamentos_recorrentes;

-- Login attempts
DROP POLICY IF EXISTS "Sistema pode inserir tentativas" ON public.login_attempts;

-- Allowed countries: restrict to authenticated
DROP POLICY IF EXISTS "Leitura pública para validação" ON public.allowed_countries;
CREATE POLICY "Autenticados podem ver allowed_countries"
ON public.allowed_countries FOR SELECT TO authenticated
USING (true);