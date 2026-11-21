-- Adiciona is_aliquota_customizada em operacoes_tributaveis.
-- A LC 214/2025 (arts. 393-400) ainda não fixa alíquota por categoria de
-- Imposto Seletivo; a coluna permite registrar o % informado pelo usuário
-- (a lei não define alíquota até a regulamentação da EC 132/2023).
-- Chamada: fluxo de cadastro de operação (is_aliquota_customizada -> is_aliquota/100).

DO $do_block$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'operacoes_tributaveis'
        AND column_name = 'is_aliquota_customizada'
  ) THEN
    ALTER TABLE ONLY public.operacoes_tributaveis
      ADD COLUMN is_aliquota_customizada numeric NOT NULL DEFAULT 0;
  END IF;
END $do_block$;
