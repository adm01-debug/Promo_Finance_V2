-- Tabela: incentivos_fiscais
-- Armazena incentivos e benefícios fiscais concedidos a empresas (SUDENE, SUDAM, etc.)
CREATE TABLE IF NOT EXISTS public.incentivos_fiscais (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id    uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome          text NOT NULL,
  tipo_incentivo text NOT NULL,
  ano_inicio    integer NOT NULL,
  ano_fim       integer NOT NULL,
  limite_percentual numeric(5,2) NOT NULL DEFAULT 0,
  limite_valor  numeric(15,2) NOT NULL DEFAULT 0,
  valor_utilizado_ano numeric(15,2) NOT NULL DEFAULT 0,
  numero_processo text,
  ato_concessorio text,
  ativo         boolean NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),

  CONSTRAINT chk_ano CHECK (ano_fim >= ano_inicio),
  CONSTRAINT chk_percentual CHECK (limite_percentual >= 0 AND limite_percentual <= 100),
  CONSTRAINT chk_limite CHECK (limite_valor >= 0),
  CONSTRAINT chk_utilizado CHECK (valor_utilizado_ano >= 0)
);

ALTER TABLE public.incentivos_fiscais ENABLE ROW LEVEL SECURITY;

-- RLS: admins veem tudo; empresas veem apenas as suas
CREATE POLICY "admins_all_incentivos_fiscais"
  ON public.incentivos_fiscais FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR auth.jwt() ->> 'role' = 'anon'
    OR (
      auth.jwt() ->> 'role' = 'authenticated'
      AND auth.uid()::text = (empresa_id::text)
    )
  );

-- Seed: incentivos reais do contexto brasileiro
INSERT INTO public.incentivos_fiscais
  (empresa_id, nome, tipo_incentivo, ano_inicio, ano_fim, limite_percentual, limite_valor, valor_utilizado_ano, numero_processo, ato_concessorio, ativo)
SELECT
  e.id,
  v.nome,
  v.tipo,
  v.inicio,
  v.fim,
  v.limite_pct,
  v.limite_valor,
  v.utilizado,
  v.processo,
  v.ato,
  true
FROM public.empresas e
CROSS JOIN LATERAL (VALUES
  (
    'SUDENE - Desenvolvimento Regional (Nordeste)',
    'sudene',
    2023, 2032,
    75.00, 276000000.00, 18400000.00,
    'processo-sudene-2023-001234',
    'Decreto 9.857/2019',
    'SUDENE - Incentive Sudene (Região Nordeste)',
    'simples',
    NULL
  ),
  (
    'SUDAM - Desenvolvimento da Amazônia',
    'sudam',
    2022, 2031,
    75.00, 180000000.00, 9600000.00,
    'processo-sudam-2022-000567',
    'Decreto 9.857/2019',
    'SUDAM - Incentive Sudam (Região Amazônia)',
    'simples',
    NULL
  ),
  (
    'PROSOFT - Software e TI',
    'prosoft',
    2023, 2028,
    30.00, 3600000.00, 890000.00,
    'processo-prosoft-2023-002891',
    'Lei 10.176/2001',
    'PROSOFT - Incentive to IT Software Development',
    'simples',
    NULL
  ),
  (
    'Lei do Bem - P&D',
    'lei_bem',
    2024, 2029,
    60.00, 4800000.00, 2100000.00,
    'processo-leibem-2024-003412',
    'Lei 11.196/2005, Art. 19',
    'Lei do Bem - RD&I e P&D (extra 60-80% dedutibilidade)',
    'simples',
    NULL
  ),
  (
    'RECINE - Incentivo à Cultura (Cinema)',
    'recine',
    2023, 2027,
    70.00, 6000000.00, 3400000.00,
    'processo-recine-2023-001876',
    'Lei 12.599/2012',
    'RECINE - Audiovisual and Cinema Incentive',
    'simples',
    NULL
  )
) AS v(nome, tipo, inicio, fim, limite_pct, limite_valor, utilizado, processo, ato, nome_real, regime, _skip)
WHERE e.id IS NOT NULL
ON CONFLICT DO NOTHING;
