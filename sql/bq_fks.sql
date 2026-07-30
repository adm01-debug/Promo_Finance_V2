-- Drop FK transacao_id existente (dados orfãos) e recriar como NOT VALID
ALTER TABLE public.bloqueios_duplicidade
  DROP CONSTRAINT IF EXISTS bloqueios_duplicidade_transacao_id_fkey;

ALTER TABLE public.bloqueios_duplicidade
  ADD CONSTRAINT bloqueios_duplicidade_transacao_id_fkey
  FOREIGN KEY (transacao_id) REFERENCES public.transacoes_bancarias(id) ON DELETE SET NULL
  NOT VALID;
