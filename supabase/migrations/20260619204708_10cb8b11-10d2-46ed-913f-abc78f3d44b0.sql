
-- 1. Função auxiliar para gerar sigla
CREATE OR REPLACE FUNCTION public.gerar_sigla_empresa(_nome text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_catalog
AS $$
  SELECT upper(
    substring(
      regexp_replace(coalesce(_nome, 'EMP'), '[^a-zA-Z0-9]', '', 'g')
      from 1 for 3
    )
  );
$$;

-- 2. Colunas novas em empresas
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS sigla text,
  ADD COLUMN IF NOT EXISTS cor_hex text;

-- 3. Backfill: sigla = 3 letras do nome_fantasia (fallback razao_social)
UPDATE public.empresas
SET sigla = public.gerar_sigla_empresa(COALESCE(nome_fantasia, razao_social))
WHERE sigla IS NULL OR sigla = '';

-- 4. Backfill: cor_hex via paleta rotativa de 8 tokens semânticos (--chart-1..8)
WITH ranked AS (
  SELECT id, row_number() OVER (ORDER BY created_at NULLS LAST, id) AS rn
  FROM public.empresas
  WHERE cor_hex IS NULL OR cor_hex = ''
)
UPDATE public.empresas e
SET cor_hex = 'chart-' || (((r.rn - 1) % 8) + 1)::text
FROM ranked r
WHERE e.id = r.id;

-- 5. Garantir constraints suaves (não bloqueiam inserts antigos)
ALTER TABLE public.empresas
  ALTER COLUMN sigla SET DEFAULT 'EMP',
  ALTER COLUMN cor_hex SET DEFAULT 'chart-1';
